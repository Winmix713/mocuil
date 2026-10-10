import type { MatchRecord, Outcome, PeriodConsistency, ScoreSampleCounts, ScoreStatus } from "./types";

export const SCORE_CONTRACT_VERSION = "2.0.0";

export type PeriodScore =
  | { status: "valid"; home: number; away: number }
  | { status: "missing" | "invalid"; home: number | null; away: number | null };

export const isIntegerScore = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export const toOutcome = (home: number, away: number): Outcome =>
  home > away ? "H" : home < away ? "A" : "D";

/** Preserve invalid input after its nonnumeric values have been normalized to null. */
export function assessPeriodScore(home: unknown, away: unknown, recordedStatus?: ScoreStatus): PeriodScore {
  const normalizedHome = isIntegerScore(home) ? home : null;
  const normalizedAway = isIntegerScore(away) ? away : null;
  if (recordedStatus !== "invalid" && normalizedHome !== null && normalizedAway !== null) {
    return { status: "valid", home: normalizedHome, away: normalizedAway };
  }
  const missing = recordedStatus !== "invalid" && recordedStatus !== "valid" && home == null && away == null;
  return { status: missing ? "missing" : "invalid", home: normalizedHome, away: normalizedAway };
}

export function periodConsistency(ft: PeriodScore, ht: PeriodScore): PeriodConsistency {
  if (ft.status !== "valid" || ht.status !== "valid") return "unavailable";
  return ft.home >= ht.home && ft.away >= ht.away ? "consistent" : "inconsistent";
}

export function assessMatchScores(match: Pick<MatchRecord, "ftHome" | "ftAway" | "htHome" | "htAway" | "ftStatus" | "htStatus">) {
  const ft = assessPeriodScore(match.ftHome, match.ftAway, match.ftStatus);
  const ht = assessPeriodScore(match.htHome, match.htAway, match.htStatus);
  return { ft, ht, consistency: periodConsistency(ft, ht) };
}

export function emptyScoreCounts(): ScoreSampleCounts {
  return { ftValid: 0, ftMissing: 0, ftInvalid: 0, htValid: 0, htMissing: 0, htInvalid: 0, htftValid: 0, htftInconsistent: 0, secondHalfValid: 0 };
}

export function countScoreSample(counts: ScoreSampleCounts, scores: ReturnType<typeof assessMatchScores>): void {
  if (scores.ft.status === "valid") counts.ftValid += 1;
  else if (scores.ft.status === "missing") counts.ftMissing += 1;
  else counts.ftInvalid += 1;
  if (scores.ht.status === "valid") counts.htValid += 1;
  else if (scores.ht.status === "missing") counts.htMissing += 1;
  else counts.htInvalid += 1;
  if (scores.ft.status === "valid" && scores.ht.status === "valid") counts.htftValid += 1;
  if (scores.consistency === "inconsistent") counts.htftInconsistent += 1;
  if (scores.consistency === "consistent") counts.secondHalfValid += 1;
}

export function sumScoreCounts(items: readonly ScoreSampleCounts[]): ScoreSampleCounts {
  const counts = emptyScoreCounts();
  for (const item of items) {
    for (const key of Object.keys(counts) as (keyof ScoreSampleCounts)[]) counts[key] += item[key];
  }
  return counts;
}
