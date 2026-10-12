import type { AuditReport, League, MatchRecord, PairSummary, PositionSummary, ScoreSampleCounts } from "./types";
import type { AuditConfig, AuditExclusion, NormalizedDataset, ReproductionSpec } from "./dataset-types";
import { REPORT_SCHEMA_VERSION, PIPELINE_VERSION } from "./dataset-types";
import { compareText, hashJson } from "./canonical";
import { isObject, pairId } from "./audit-core";
import { analyzePairMatches, type PairAnalysis } from "./pair-analysis";
import { SCORE_CONTRACT_VERSION, sumScoreCounts } from "./score-validation";

/** Normalize set-like options before hashing; reject typos instead of broadening a run. */
export function normalizeAuditConfig(value: unknown = {}): AuditConfig {
  if (!isObject(value)) throw new Error("Az auditkonfiguráció JSON-objektum legyen.");
  const allowed = new Set(["leagues", "seasonKeys", "rounds", "pair", "minPairSamples", "ft", "ht", "secondHalf"]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`Ismeretlen auditbeállítás: ${key}.`);
  const leagues = value.leagues ?? ["angol", "spanyol"];
  const seasonKeys = value.seasonKeys ?? [];
  const rounds = value.rounds ?? [];
  const minPairSamples = value.minPairSamples ?? 1;
  if (!Array.isArray(leagues) || !leagues.length || leagues.some(v => v !== "angol" && v !== "spanyol")) throw new Error("Érvénytelen ligaszűrő.");
  if (!Array.isArray(seasonKeys) || seasonKeys.some(v => typeof v !== "string" || !v.trim())) throw new Error("Érvénytelen szezonazonosító-szűrő.");
  if (!Array.isArray(rounds) || rounds.some(v => !Number.isInteger(v) || v < 1 || v > 30)) throw new Error("A fordulók az 1–30 tartományba essenek.");
  if (!Number.isSafeInteger(minPairSamples) || (minPairSamples as number) < 1) throw new Error("A minimum minta pozitív egész legyen.");
  const period = (key: string): "any" | "valid" => {
    const v = value[key] ?? "any";
    if (v !== "any" && v !== "valid") throw new Error(`Érvénytelen ${key} feltétel.`);
    return v;
  };
  let pair: AuditConfig["pair"] = null;
  if (value.pair != null) {
    const p = value.pair;
    if (!isObject(p) || Object.keys(p).some(k => !["league", "homeTeam", "awayTeam"].includes(k)) || (p.league !== "angol" && p.league !== "spanyol") || typeof p.homeTeam !== "string" || typeof p.awayTeam !== "string" || !p.homeTeam.trim() || !p.awayTeam.trim() || p.homeTeam.trim() === p.awayTeam.trim()) throw new Error("Érvénytelen rendezett csapatpár.");
    if (!leagues.includes(p.league)) throw new Error("A csapatpár ligája nincs a kiválasztott ligák között.");
    pair = { league: p.league, homeTeam: p.homeTeam.trim(), awayTeam: p.awayTeam.trim() };
  }
  return { leagues: [...new Set(leagues)].sort() as League[], seasonKeys: [...new Set(seasonKeys)].sort(compareText), rounds: [...new Set(rounds)].sort((a, b) => a - b), pair, minPairSamples: minPairSamples as number, ft: period("ft"), ht: period("ht"), secondHalf: period("secondHalf") };
}

function counts(analysis: PairAnalysis): ScoreSampleCounts {
  return { ftValid: analysis.validFt, ftMissing: analysis.missingFt, ftInvalid: analysis.invalidFt,
    htValid: analysis.validHt, htMissing: analysis.missingHt, htInvalid: analysis.invalidHt,
    htftValid: analysis.validHtFt, htftInconsistent: analysis.inconsistentHtFt, secondHalfValid: analysis.validSecondHalf };
}
function groupBy<T>(values: readonly T[], key: (value: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const value of values) {
    const id = key(value), group = groups.get(id) ?? [];
    group.push(value); groups.set(id, group);
  }
  return groups;
}

/** Sole aggregation implementation shared by Node and Worker; the caller owns the clock. */
export async function createAuditReport(dataset: NormalizedDataset, options: unknown, completedAt: string): Promise<AuditReport> {
  if (dataset.pipelineVersion !== PIPELINE_VERSION || dataset.scoreContractVersion !== SCORE_CONTRACT_VERSION) throw new Error("A dataset más pipeline- vagy számítási verzióhoz tartozik; új import szükséges.");
  if (!Number.isFinite(Date.parse(completedAt))) throw new Error("Érvénytelen futási időbélyeg.");
  const config = normalizeAuditConfig(options);
  const knownSeasons = new Set(dataset.seasons.map(season => season.id));
  for (const key of config.seasonKeys) if (!knownSeasons.has(key)) throw new Error(`Ismeretlen szezonazonosító: ${key}.`);
  const exclusions: AuditExclusion[] = [];
  const candidates: MatchRecord[] = [];
  for (const match of dataset.matches) {
    const reasons: string[] = [];
    if (!config.leagues.includes(match.league)) reasons.push("LEAGUE_FILTER");
    if (config.seasonKeys.length && !config.seasonKeys.includes(match.seasonKey)) reasons.push("SEASON_FILTER");
    if (config.rounds.length && !config.rounds.includes(match.roundNo)) reasons.push("ROUND_FILTER");
    if (config.pair && pairId(match.league, match.homeTeam, match.awayTeam) !== pairId(config.pair.league, config.pair.homeTeam, config.pair.awayTeam)) reasons.push("PAIR_FILTER");
    if (config.ft === "valid" && match.ftStatus !== "valid") reasons.push("FT_REQUIRE_VALID");
    if (config.ht === "valid" && match.htStatus !== "valid") reasons.push("HT_REQUIRE_VALID");
    if (config.secondHalf === "valid" && match.periodConsistency !== "consistent") reasons.push("SECOND_HALF_REQUIRE_VALID");
    if (reasons.length) exclusions.push({ recordId: match.id, scope: "record", reasons });
    else candidates.push(match);
  }
  const candidatePairs = groupBy(candidates, m => pairId(m.league, m.homeTeam, m.awayTeam));
  const matches = candidates.filter(match => {
    if (candidatePairs.get(pairId(match.league, match.homeTeam, match.awayTeam))!.length >= config.minPairSamples) return true;
    exclusions.push({ recordId: match.id, scope: "record", reasons: ["MIN_PAIR_SAMPLES"] });
    return false;
  });
  for (const match of matches) {
    const reasons: string[] = [];
    if (match.ftStatus !== "valid") reasons.push(`FT_${match.ftStatus.toUpperCase()}`);
    if (match.htStatus !== "valid") reasons.push(`HT_${match.htStatus.toUpperCase()}`);
    if (match.periodConsistency !== "consistent") reasons.push(`SECOND_HALF_${match.periodConsistency.toUpperCase()}`);
    if (reasons.length) exclusions.push({ recordId: match.id, scope: "metric", reasons });
  }
  exclusions.sort((a, b) => compareText(a.recordId, b.recordId) || compareText(a.scope, b.scope));
  const pairs: PairSummary[] = [...groupBy(matches, m => pairId(m.league, m.homeTeam, m.awayTeam)).values()].map(rows => {
    const first = rows[0], analysis = analyzePairMatches(rows);
    const seasons = [...groupBy(rows, match => match.seasonKey).values()].map(season => ({
      seasonIndex: season[0].seasonIndex, seasonName: season[0].seasonName, matches: season.length,
      ...counts(analyzePairMatches(season)),
    })).sort((a, b) => a.seasonIndex - b.seasonIndex);
    return { league: first.league, homeTeam: first.homeTeam, awayTeam: first.awayTeam, matches: rows.length,
      ...counts(analysis), analysis, recordIds: rows.map(match => match.id), ftScores: analysis.ftScores, htftOutcomes: analysis.htftOutcomes, htftScores: analysis.htftScores, seasons };
  }).sort((a, b) => compareText(a.league, b.league) || compareText(a.homeTeam, b.homeTeam) || compareText(a.awayTeam, b.awayTeam));
  const byPosition = groupBy(matches, match => `${match.league}:${match.matchPosition}`);
  const positions: PositionSummary[] = [];
  for (const league of ["angol", "spanyol"] as const) for (let position = 1; position <= 240; position++) {
    const rows = byPosition.get(`${league}:${position}`) ?? [];
    const analysis = analyzePairMatches(rows);
    const topPairs = [...groupBy(rows, match => `${match.homeTeam} · ${match.awayTeam}`).entries()]
      .map(([key, list]) => ({ key, count: list.length, rate: list.length / rows.length }))
      .sort((a, b) => b.count - a.count || compareText(a.key, b.key)).slice(0, 3);
    positions.push({ league, matchPosition: position, roundNo: Math.floor((position - 1) / 8) + 1, matchInRound: (position - 1) % 8 + 1,
      observations: rows.length, ...counts(analysis), ftOutcomes: analysis.ftOutcomes, htftOutcomes: analysis.htftOutcomes, topPairs });
  }
  const seasons = dataset.quality.seasons;
  const leagues = {} as AuditReport["leagues"];
  for (const league of ["angol", "spanyol"] as const) {
    const sourceSeasons = seasons.filter(season => season.league === league);
    const selectedPairs = pairs.filter(pair => pair.league === league);
    leagues[league] = { league, seasonCount: new Set(matches.filter(m => m.league === league).map(m => m.seasonKey)).size,
      matches: selectedPairs.reduce((n, pair) => n + pair.matches, 0), ...sumScoreCounts(selectedPairs), pairCount: selectedPairs.length,
      eachSeasonHas240: sourceSeasons.every(s => s.matches === 240), eachSeasonHas16Teams: sourceSeasons.every(s => s.teams === 16),
      eachSeasonHas240Pairs: sourceSeasons.every(s => s.orderedPairs === 240), identicalPairSets: sourceSeasons.every(s => s.pairSetMatches),
      roundBlocksValid: sourceSeasons.every(s => s.roundBlocksValid) };
  }
  const runId = `audit:${(await hashJson({ datasetHash: dataset.datasetHash, pipelineVersion: PIPELINE_VERSION, scoreContractVersion: SCORE_CONTRACT_VERSION, reportSchemaVersion: REPORT_SCHEMA_VERSION, config })).slice(7)}`;
  const reproduction: ReproductionSpec = { datasetHash: dataset.datasetHash, pipelineVersion: PIPELINE_VERSION, scoreContractVersion: SCORE_CONTRACT_VERSION, runId, config, manifest: dataset.manifest };
  return {
    reportSchemaVersion: REPORT_SCHEMA_VERSION, pipelineVersion: PIPELINE_VERSION, scoreContractVersion: SCORE_CONTRACT_VERSION,
    runId, datasetHash: dataset.datasetHash, sourceHash: dataset.sourceHash, completedAt, config,
    inputRecordIds: dataset.matches.map(match => match.id), exclusions, reproduction, quarantine: dataset.quarantine, dataQuality: dataset.quality,
    source: dataset.manifest.source, commitSha: dataset.manifest.commitSha, treeSha: dataset.manifest.treeSha, exportedAt: dataset.manifest.exportedAt,
    sourceFileCount: dataset.sources.length, sourceBytes: dataset.manifest.expectedByteCount,
    sourceRecordCount: dataset.quality.sourceRecordCount, matchCount: matches.length, ...sumScoreCounts(pairs),
    skippedRecords: dataset.quality.excludedRecordCount, checksumFailures: 0, issueCount: seasons.reduce((n, season) => n + season.issueCount, 0),
    roundBlocksValid: seasons.every(s => s.roundBlocksValid), pairSetsIdentical: seasons.every(s => s.pairSetMatches),
    leagues, pairs, positions, seasons, matches,
  };
}

export function assertReproductionVersion(spec: ReproductionSpec): void {
  if (spec.pipelineVersion !== PIPELINE_VERSION || spec.scoreContractVersion !== SCORE_CONTRACT_VERSION) throw new Error("A korábbi audit más pipeline-/számítási verzióval készült; ebben a verzióban nem reprodukálható.");
}
export function assertReproduced(spec: ReproductionSpec, report: AuditReport): void {
  assertReproductionVersion(spec);
  if (spec.datasetHash !== report.datasetHash || spec.runId !== report.runId) throw new Error("Reprodukálási eltérés: a dataset-hash vagy a futásazonosító megváltozott; az új riport nem publikálható.");
}
