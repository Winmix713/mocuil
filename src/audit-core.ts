import type { ArchiveSeasonFile, MatchRecord } from "./types";
import type { NormalizedBatch, QuarantineEntry, VerifiedSource } from "./dataset-types";
import { PIPELINE_VERSION } from "./dataset-types";
import { assessPeriodScore, periodConsistency, toOutcome } from "./score-validation";

export const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";
export const matchStableId = (seasonKey: string, position: number): string =>
  `match:${encodeURIComponent(seasonKey)}:${position}`;
export const teamStableId = (league: string, name: string): string =>
  `team:${league}:${encodeURIComponent(name)}`;
export const pairId = (league: string, home: string, away: string): string => JSON.stringify([league, home, away]);

function assessKickoff(value: unknown): { value: string | null; status: "valid" | "missing" | "invalid" } {
  if (value == null) return { value: null, status: "missing" };
  // Require an explicit zone and a real calendar date. HH:MM remains virtual time.
  if (typeof value !== "string") return { value: null, status: "invalid" };
  const parts = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.exec(value);
  if (!parts || !Number.isFinite(Date.parse(value)) || new Date(`${parts[1]}T00:00:00Z`).toISOString().slice(0, 10) !== parts[1]) return { value: null, status: "invalid" };
  return { value, status: "valid" };
}

export function quarantineEntry(file: ArchiveSeasonFile, row: number | null, raw: unknown, reasons: string[], recordId: string | null = null, disposition: "excluded" | "retained" = "excluded"): QuarantineEntry {
  return {
    id: `quarantine:${encodeURIComponent(file.path)}:${row ?? "season"}`,
    sourcePath: file.path, sourceHash: file.sha, sourceRow: row, recordId,
    importVersion: PIPELINE_VERSION, scope: row === null ? "season" : "match", disposition,
    reasonCodes: [...new Set(reasons)].sort(), raw,
  };
}

/** Pure normalization: no I/O, clocks, inferred scores, or mutation of source objects. */
export function normalizeMatch(file: ArchiveSeasonFile, seasonKey: string, raw: unknown, sourceRow = 1, sourceContentHash: string | null = null): { record: MatchRecord | null; reasons: string[] } {
  if (!isObject(raw)) return { record: null, reasons: ["INVALID_RECORD"] };
  const reasons: string[] = [];
  const position = raw.match_no;
  const home = text(raw.home_team), away = text(raw.away_team);
  if (typeof position !== "number" || !Number.isInteger(position) || position < 1 || position > 240) reasons.push("INVALID_POSITION");
  if (!home || !away) reasons.push("MISSING_TEAM");
  if (home && home === away) reasons.push("SELF_PAIR");
  if (reasons.length) return { record: null, reasons };
  const ft = assessPeriodScore(raw.home_score, raw.away_score);
  const ht = assessPeriodScore(raw.ht_home_score, raw.ht_away_score);
  const consistency = periodConsistency(ft, ht);
  const kickoff = assessKickoff(raw.kickoffIso);
  if (ft.status !== "valid") reasons.push(`FT_${ft.status.toUpperCase()}`);
  if (ht.status === "invalid") reasons.push("HT_INVALID");
  if (consistency === "inconsistent") reasons.push("HT_EXCEEDS_FT");
  if (kickoff.status === "invalid") reasons.push("INVALID_KICKOFF_ISO");
  const matchPosition = position as number;
  return { reasons, record: {
    id: matchStableId(seasonKey, matchPosition), sourcePath: file.path, sourceHash: file.sha, sourceRow,
    sourceContentHash, importVersion: PIPELINE_VERSION,
    league: file.league, seasonIndex: file.seasonIndex, seasonName: file.seasonName, seasonKey,
    matchPosition, roundNo: Math.floor((matchPosition - 1) / 8) + 1, matchInRound: (matchPosition - 1) % 8 + 1,
    virtualTime: typeof raw.date === "string" ? raw.date : null,
    kickoffIso: kickoff.value, kickoffIsoStatus: kickoff.status,
    qualityStatus: ft.status === "invalid" || ht.status === "invalid" || consistency === "inconsistent" || kickoff.status === "invalid"
      ? "invalid" : ft.status === "missing" || ht.status === "missing" || kickoff.status === "missing" ? "missing" : "valid",
    homeTeam: home, awayTeam: away, homeTeamId: teamStableId(file.league, home), awayTeamId: teamStableId(file.league, away),
    htHome: ht.home, htAway: ht.away, ftHome: ft.home, ftAway: ft.away,
    ftStatus: ft.status, htStatus: ht.status, periodConsistency: consistency,
    ftOutcome: ft.status === "valid" ? toOutcome(ft.home, ft.away) : null,
    htOutcome: ht.status === "valid" ? toOutcome(ht.home, ht.away) : null,
  } };
}

export function normalizeSeason(source: VerifiedSource, raw: unknown, extraReasons: string[] = []): NormalizedBatch {
  const root = isObject(raw) ? raw : {};
  const rows = Array.isArray(root.matches) ? root.matches : [];
  const id = text(root.id);
  const fatal = [...extraReasons];
  if (!isObject(raw)) fatal.push("INVALID_SEASON");
  if (!id) fatal.push("MISSING_SEASON_ID");
  if (root.league !== source.league) fatal.push("SEASON_LEAGUE_MISMATCH");
  if (root.seasonIndex !== source.seasonIndex) fatal.push("SEASON_INDEX_MISMATCH");
  if (!Array.isArray(root.matches)) fatal.push("INVALID_MATCHES_ARRAY");
  const batch: NormalizedBatch = {
    source, raw,
    season: { id: id || null, league: source.league, seasonIndex: source.seasonIndex, seasonName: source.seasonName,
      sourcePath: source.path, sourceHash: source.sha, sourceContentHash: typeof root.contentHash === "string" ? root.contentHash : null,
      importVersion: PIPELINE_VERSION, status: fatal.length ? "invalid" : "valid" },
    sourceRecordCount: rows.length, matches: [], quarantine: [], issues: [], duplicatePositions: 0,
  };
  if (rows.length !== 240) batch.issues.push(`A várt 240 helyett ${rows.length} mérkőzéssor található.`);
  if (root.actualMatchCount !== 240) batch.issues.push(`Az actualMatchCount értéke ${String(root.actualMatchCount)}, nem 240.`);
  if (fatal.length) {
    batch.quarantine.push(quarantineEntry(source, null, raw, fatal));
    batch.issues.push(...fatal);
    return batch;
  }
  const positions = new Map<number, number>();
  for (const row of rows) if (isObject(row) && typeof row.match_no === "number") positions.set(row.match_no, (positions.get(row.match_no) ?? 0) + 1);
  batch.duplicatePositions = [...positions.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  for (const [index, row] of rows.entries()) {
    const normalized = normalizeMatch(source, id, row, index + 1, batch.season.sourceContentHash);
    const duplicate = isObject(row) && typeof row.match_no === "number" && (positions.get(row.match_no) ?? 0) > 1;
    if (duplicate) normalized.reasons.push("DUPLICATE_MATCH_ID");
    const excluded = !normalized.record || duplicate;
    if (normalized.reasons.length) {
      batch.quarantine.push(quarantineEntry(source, index + 1, row, normalized.reasons, normalized.record?.id ?? null, excluded ? "excluded" : "retained"));
      batch.issues.push(...normalized.reasons.map(code => `${code}: ${index + 1}. forrássor.`));
    }
    if (!excluded && normalized.record) batch.matches.push(normalized.record);
  }
  return batch;
}
