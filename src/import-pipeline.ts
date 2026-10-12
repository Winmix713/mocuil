import type { ArchiveManifest, ArchiveSeasonFile, MatchRecord, SeasonQuality } from "./types";
import type { NormalizedBatch, NormalizedDataset, VerifiedSource } from "./dataset-types";
import { DATASET_SCHEMA_VERSION, PIPELINE_VERSION } from "./dataset-types";
import { isObject, normalizeSeason, pairId, quarantineEntry } from "./audit-core";
import { compareText, digestHex, gitBlobSha1, hashJson } from "./canonical";
import { assessMatchScores, countScoreSample, emptyScoreCounts, SCORE_CONTRACT_VERSION } from "./score-validation";

export function validateManifest(value: unknown): asserts value is ArchiveManifest {
  if (!isObject(value) || !Array.isArray(value.files) || !value.files.length || value.files.length !== value.seasonCount) throw new Error("A manifeszt hibás: a fájllista és szezonösszeg nem egyezik.");
  for (const key of ["source", "commitSha", "treeSha", "exportedAt"]) if (typeof value[key] !== "string" || !value[key]) throw new Error(`Hiányzó manifesztmező: ${key}.`);
  const paths = new Set<string>();
  const scopes = new Set<string>();
  let bytes = 0;
  for (const file of value.files) {
    if (!isObject(file) || typeof file.path !== "string" || !file.path || file.path.startsWith("/") || file.path.split("/").some(part => part === ".." || part === ".") || file.path.includes("\\")) throw new Error("Érvénytelen forrásútvonal.");
    if (paths.has(file.path)) throw new Error(`Duplikált forrásútvonal: ${file.path}.`);
    paths.add(file.path);
    if ((file.league !== "angol" && file.league !== "spanyol") || !Number.isSafeInteger(file.seasonIndex) || (file.seasonIndex as number) < 1 || typeof file.seasonName !== "string") throw new Error(`Érvénytelen szezonleíró: ${file.path}.`);
    const scope = `${file.league}:${file.seasonIndex}`;
    if (scopes.has(scope)) throw new Error(`Duplikált liga/szezonindex: ${scope}.`);
    scopes.add(scope);
    if (typeof file.sha !== "string" || !/^[a-f0-9]{40}$/.test(file.sha) || !Number.isSafeInteger(file.size) || (file.size as number) < 0 || typeof file.url !== "string") throw new Error(`Érvénytelen forráshash, méret vagy URL: ${file.path}.`);
    if (new URL(file.url).protocol !== "https:") throw new Error(`A forrás URL nem HTTPS: ${file.path}.`);
    bytes += file.size as number;
  }
  if (bytes !== value.expectedByteCount) throw new Error("A manifeszt bájtösszege nem egyezik a fájlméretek összegével.");
}

export async function verifySourceBytes(file: ArchiveSeasonFile, bytes: Uint8Array): Promise<VerifiedSource> {
  if (bytes.byteLength !== file.size) throw new Error(`Méreteltérés: ${bytes.byteLength} bájt érkezett, ${file.size} bájt volt a manifesztben.`);
  const [sha, sha256] = await Promise.all([gitBlobSha1(bytes), digestHex("SHA-256", bytes)]);
  if (sha !== file.sha) throw new Error(`Git-blob SHA-1 eltérés: ${sha}`);
  return { ...file, sha256: `sha256:${sha256}` };
}

/** Shared byte-to-record pipeline. Integrity failure is fatal; schema failures are quarantined. */
export async function ingestSeason(file: ArchiveSeasonFile, bytes: Uint8Array): Promise<NormalizedBatch> {
  const source = await verifySourceBytes(file, bytes);
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch {
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
    return normalizeSeason(source, { encoding: "base64", data: btoa(binary) }, ["INVALID_UTF8"]);
  }
  let parsed: unknown;
  try { parsed = JSON.parse(text); }
  catch { return normalizeSeason(source, text, ["INVALID_JSON"]); }
  return normalizeSeason(source, parsed);
}

export const compareMatches = (a: MatchRecord, b: MatchRecord): number =>
  compareText(a.league, b.league) || a.seasonIndex - b.seasonIndex || a.matchPosition - b.matchPosition || compareText(a.id, b.id);

function seasonQuality(batch: NormalizedBatch): SeasonQuality {
  const issues = [...batch.issues];
  const teams = new Set<string>(), positions = new Set<number>(), pairs = new Set<string>();
  const rounds = new Map<number, MatchRecord[]>();
  const counts = emptyScoreCounts();
  for (const match of batch.matches) {
    teams.add(match.homeTeam); teams.add(match.awayTeam); positions.add(match.matchPosition);
    pairs.add(pairId(match.league, match.homeTeam, match.awayTeam));
    const round = rounds.get(match.roundNo) ?? [];
    round.push(match); rounds.set(match.roundNo, round);
    countScoreSample(counts, assessMatchScores(match));
  }
  const missingPositions = 240 - positions.size;
  if (missingPositions) issues.push(`${missingPositions} mérkőzéspozíció hiányzik az 1–240 tartományból.`);
  if (teams.size !== 16) issues.push(`A várt 16 helyett ${teams.size} egyedi csapatnév szerepel.`);
  if (pairs.size !== 240) issues.push(`A várt 240 helyett ${pairs.size} egyedi rendezett hazai–vendég párosítás található.`);
  let roundBlocksValid = true;
  for (let round = 1; round <= 30; round++) {
    const matches = rounds.get(round) ?? [];
    const times = new Set(matches.map(match => match.virtualTime));
    const participants = new Set(matches.flatMap(match => [match.homeTeam, match.awayTeam]));
    if (matches.length !== 8 || times.size !== 1 || times.has(null) || times.has("") || participants.size !== 16) {
      roundBlocksValid = false;
      issues.push(`A ${round}. forduló nem 8 mérkőzésből, 16 csapatból és egyetlen nem üres virtuális időből áll.`);
    }
  }
  return {
    league: batch.source.league, seasonIndex: batch.source.seasonIndex, seasonName: batch.source.seasonName,
    filePath: batch.source.path, fileBytes: batch.source.size, fileHashValid: true,
    matches: batch.sourceRecordCount, teams: teams.size, orderedPairs: pairs.size, ...counts,
    skippedRecords: batch.sourceRecordCount - batch.matches.length, duplicatePositions: batch.duplicatePositions,
    missingPositions, pairSetMatches: true, roundBlocksValid, issueCount: issues.length, issues,
  };
}

/** Deterministic assembly. Completion order cannot choose a baseline or a duplicate winner. */
export async function buildDataset(manifest: ArchiveManifest, input: readonly NormalizedBatch[]): Promise<NormalizedDataset> {
  validateManifest(manifest);
  const files = [...manifest.files].sort((a, b) => compareText(a.league, b.league) || a.seasonIndex - b.seasonIndex || compareText(a.path, b.path));
  const byPath = new Map(input.map(batch => [batch.source.path, batch]));
  if (byPath.size !== input.length || input.length !== files.length) throw new Error("Hiányos vagy duplikált import: minden forrásfájl pontosan egyszer szükséges.");
  let batches = files.map(file => {
    const batch = byPath.get(file.path);
    if (!batch || batch.source.sha !== file.sha || batch.source.size !== file.size || batch.source.league !== file.league || batch.source.seasonIndex !== file.seasonIndex || batch.source.seasonName !== file.seasonName) throw new Error(`Az import nem ehhez a manifeszthez tartozik: ${file.path}.`);
    return batch;
  });
  const seasonIds = new Map<string, number>();
  for (const batch of batches) if (batch.season.id) seasonIds.set(batch.season.id, (seasonIds.get(batch.season.id) ?? 0) + 1);
  batches = batches.map(batch => batch.season.id && (seasonIds.get(batch.season.id) ?? 0) > 1 ? {
    ...batch, season: { ...batch.season, status: "invalid" as const }, matches: [],
    quarantine: [quarantineEntry(batch.source, null, batch.raw, ["DUPLICATE_SEASON_ID"])],
    issues: [...batch.issues, "DUPLICATE_SEASON_ID: az összes ütköző szezon kizárva."],
  } : batch);
  const matches = batches.flatMap(batch => batch.matches).sort(compareMatches);
  if (new Set(matches.map(match => match.id)).size !== matches.length) throw new Error("Belső invariáns sérült: nem egyedi normalizált meccsazonosító.");
  const seasons = batches.map(seasonQuality);
  const baselines = new Map<string, Set<string>>();
  for (let i = 0; i < batches.length; i++) {
    const keys = new Set(batches[i].matches.map(match => pairId(match.league, match.homeTeam, match.awayTeam)));
    const baseline = baselines.get(seasons[i].league);
    if (!baseline) baselines.set(seasons[i].league, keys);
    else if (baseline.size !== keys.size || [...baseline].some(key => !keys.has(key))) {
      seasons[i].pairSetMatches = false;
      seasons[i].issues.push("A párosításkészlet eltér a liga legkisebb indexű szezonjától.");
      seasons[i].issueCount++;
    }
  }
  const sources = batches.map(batch => batch.source);
  const sourceHash = await hashJson({ source: manifest.source, commitSha: manifest.commitSha,
    files: sources.map(({ url: _url, ...source }) => source) });
  const quarantine = batches.flatMap(batch => batch.quarantine).sort((a, b) => compareText(a.sourcePath, b.sourcePath) || (a.sourceRow ?? 0) - (b.sourceRow ?? 0));
  const sourceRecordCount = batches.reduce((n, batch) => n + batch.sourceRecordCount, 0);
  const teamMap = new Map<string, { id: string; league: MatchRecord["league"]; name: string }>();
  for (const match of matches) {
    teamMap.set(match.homeTeamId, { id: match.homeTeamId, league: match.league, name: match.homeTeam });
    teamMap.set(match.awayTeamId, { id: match.awayTeamId, league: match.league, name: match.awayTeam });
  }
  const content = {
    schemaVersion: DATASET_SCHEMA_VERSION as 1, pipelineVersion: PIPELINE_VERSION, scoreContractVersion: SCORE_CONTRACT_VERSION, sourceHash,
    leagues: (["angol", "spanyol"] as const).filter(id => sources.some(source => source.league === id)).map(id => ({ id, name: id === "angol" ? "Angol" : "Spanyol" })),
    teams: [...teamMap.values()].sort((a, b) => compareText(a.id, b.id)),
    seasons: batches.map(batch => batch.season), matches, quarantine,
    quality: {
      sourceRecordCount, acceptedRecordCount: matches.length, excludedRecordCount: sourceRecordCount - matches.length,
      quarantinedEntries: quarantine.length, retainedFlaggedRecords: quarantine.filter(entry => entry.disposition === "retained").length,
      missingKickoffIso: matches.filter(match => match.kickoffIsoStatus === "missing").length,
      invalidKickoffIso: matches.filter(match => match.kickoffIsoStatus === "invalid").length,
      importErrorRate: sourceRecordCount ? (sourceRecordCount - matches.length) / sourceRecordCount : 0, seasons,
    },
  };
  return { ...content, datasetHash: await hashJson(content), manifest: { ...manifest, files }, sources };
}
