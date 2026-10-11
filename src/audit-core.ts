import type { ArchiveSeasonFile, MatchRecord, PeriodConsistency, ScoreStatus } from "./types";
import { assessPeriodScore, periodConsistency, toOutcome } from "./score-validation";

export interface RawMatchRecord {
  match_no?: unknown;
  date?: unknown;
  home_team?: unknown;
  away_team?: unknown;
  ht_home_score?: unknown;
  ht_away_score?: unknown;
  home_score?: unknown;
  away_score?: unknown;
}

export interface NormalizedMatchResult {
  record: MatchRecord;
  pairKey: string;
  issues: string[];
}

const asTeam = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const asPosition = (value: unknown): number => typeof value === "number" && Number.isInteger(value) ? value : -1;

export const matchStableId = (file: ArchiveSeasonFile, position: number): string =>
  `${file.league}:${file.seasonIndex}:${position}`;

export function normalizeMatch(file: ArchiveSeasonFile, seasonKey: string, raw: RawMatchRecord): NormalizedMatchResult | null {
  const position = asPosition(raw.match_no);
  const homeTeam = asTeam(raw.home_team);
  const awayTeam = asTeam(raw.away_team);
  const issues: string[] = [];
  if (position < 1 || position > 240) issues.push(`Érvénytelen mérkőzéspozíció: ${String(raw.match_no)}.`);
  if (!homeTeam || !awayTeam) {
    issues.push(`Hiányzó hazai vagy vendégcsapat a ${position > 0 ? position : "ismeretlen"}. pozíción.`);
    return null;
  }

  const ft = assessPeriodScore(raw.home_score, raw.away_score);
  const ht = assessPeriodScore(raw.ht_home_score, raw.ht_away_score);
  const consistency: PeriodConsistency = periodConsistency(ft, ht);
  const ftOutcome = ft.status === "valid" ? toOutcome(ft.home, ft.away) : null;
  const htOutcome = ht.status === "valid" ? toOutcome(ht.home, ht.away) : null;
  if (ft.status !== "valid") issues.push(`FT_${ft.status.toUpperCase()}: ${position}. pozíció.`);
  if (ht.status === "invalid") issues.push(`HT_INVALID: ${position}. pozíció.`);
  if (consistency === "inconsistent") issues.push(`HT_EXCEEDS_FT: ${position}. pozíció; a második félidős mintából kizárva.`);

  const record: MatchRecord = {
    id: matchStableId(file, position),
    sourcePath: file.path,
    sourceHash: file.sha,
    league: file.league,
    seasonIndex: file.seasonIndex,
    seasonName: file.seasonName,
    seasonKey,
    matchPosition: position,
    roundNo: position > 0 ? Math.floor((position - 1) / 8) + 1 : 0,
    matchInRound: position > 0 ? ((position - 1) % 8) + 1 : 0,
    virtualTime: typeof raw.date === "string" ? raw.date : null,
    homeTeam,
    awayTeam,
    htHome: ht.home,
    htAway: ht.away,
    ftHome: ft.home,
    ftAway: ft.away,
    ftStatus: ft.status as ScoreStatus,
    htStatus: ht.status as ScoreStatus,
    periodConsistency: consistency,
    ftOutcome,
    htOutcome,
  };
  return { record, pairKey: `${file.league}\u241f${homeTeam}\u241f${awayTeam}`, issues };
}

export const auditRunId = (manifestTreeSha: string, scoreContractVersion: string): string =>
  `${manifestTreeSha}:${scoreContractVersion}`;
