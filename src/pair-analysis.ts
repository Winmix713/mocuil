import { compareText } from "./canonical";
import type { Frequency, MatchRecord } from "./types";
import { assessMatchScores, countScoreSample, emptyScoreCounts, toOutcome } from "./score-validation";

export interface GoalLineSummary {
  line: string;
  overCount: number;
  overRate: number;
  underCount: number;
  underRate: number;
}

export interface PairAnalysis {
  validFt: number;
  validHt: number;
  validHtFt: number;
  validSecondHalf: number;
  missingFt: number;
  invalidFt: number;
  missingHt: number;
  invalidHt: number;
  inconsistentHtFt: number;
  averages: {
    ftTotal: number | null;
    ftHome: number | null;
    ftAway: number | null;
    htTotal: number | null;
    htHome: number | null;
    htAway: number | null;
    secondHalfTotal: number | null;
    secondHalfHome: number | null;
    secondHalfAway: number | null;
  };
  ftOutcomes: Frequency[];
  htOutcomes: Frequency[];
  secondHalfOutcomes: Frequency[];
  halfWithMoreGoals: Frequency[];
  ftBtts: Frequency[];
  htBtts: Frequency[];
  secondHalfBtts: Frequency[];
  bttsOver25: Frequency[];
  cleanSheets: Frequency[];
  ftGoals: Frequency[];
  htGoals: Frequency[];
  secondHalfGoals: Frequency[];
  homeGoals: Frequency[];
  awayGoals: Frequency[];
  ftScores: Frequency[];
  htScores: Frequency[];
  htftOutcomes: Frequency[];
  htftScores: Frequency[];
  ftGoalLines: GoalLineSummary[];
  htGoalLines: GoalLineSummary[];
  secondHalfGoalLines: GoalLineSummary[];
}

type Counts = Map<string, number>;

const add = (counts: Counts, key: string) => counts.set(key, (counts.get(key) ?? 0) + 1);
const bucket = (value: number, maxExact: number) => value > maxExact ? `${maxExact + 1}+` : String(value);

function frequencies(counts: Counts, denominator: number, order?: string[]): Frequency[] {
  if (!denominator) return [];
  const orderIndex = order ? new Map(order.map((key, index) => [key, index])) : null;
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort(([keyA, countA], [keyB, countB]) => orderIndex
      ? (orderIndex.get(keyA) ?? Number.MAX_SAFE_INTEGER) - (orderIndex.get(keyB) ?? Number.MAX_SAFE_INTEGER)
      : countB - countA || compareText(keyA, keyB))
    .map(([key, count]) => ({ key, count, rate: count / denominator }));
}

function goalLines(totals: number[]): GoalLineSummary[] {
  if (!totals.length) return [];
  return [0.5, 1.5, 2.5, 3.5, 4.5].map((threshold) => {
    const overCount = totals.filter((total) => total > threshold).length;
    const underCount = totals.length - overCount;
    return {
      line: String(threshold).replace(".", ","),
      overCount,
      overRate: totals.length ? overCount / totals.length : 0,
      underCount,
      underRate: totals.length ? underCount / totals.length : 0,
    };
  });
}

function mean(sum: number, count: number): number | null {
  return count ? sum / count : null;
}

export function analyzePairMatches(matches: MatchRecord[]): PairAnalysis {
  const ftOutcomeCounts: Counts = new Map();
  const htOutcomeCounts: Counts = new Map();
  const secondHalfOutcomeCounts: Counts = new Map();
  const halfWithMoreGoalsCounts: Counts = new Map();
  const ftBttsCounts: Counts = new Map();
  const htBttsCounts: Counts = new Map();
  const secondHalfBttsCounts: Counts = new Map();
  const bttsOver25Counts: Counts = new Map();
  const cleanSheetCounts: Counts = new Map();
  const ftGoalCounts: Counts = new Map();
  const htGoalCounts: Counts = new Map();
  const secondHalfGoalCounts: Counts = new Map();
  const homeGoalCounts: Counts = new Map();
  const awayGoalCounts: Counts = new Map();
  const ftScoreCounts: Counts = new Map();
  const htScoreCounts: Counts = new Map();
  const htftOutcomeCounts: Counts = new Map();
  const htftScoreCounts: Counts = new Map();
  const ftTotals: number[] = [];
  const htTotals: number[] = [];
  const secondHalfTotals: number[] = [];
  let ftHomeSum = 0;
  let ftAwaySum = 0;
  let htHomeSum = 0;
  let htAwaySum = 0;
  let secondHalfHomeSum = 0;
  let secondHalfAwaySum = 0;
  const samples = emptyScoreCounts();

  for (const match of matches) {
    const scores = assessMatchScores(match);
    countScoreSample(samples, scores);
    const { ft, ht, consistency } = scores;
    if (ft.status === "valid") {
      const ftHome = ft.home;
      const ftAway = ft.away;
      const ftTotal = ftHome + ftAway;
      const ftOutcome = toOutcome(ftHome, ftAway);
      const btts = ftHome > 0 && ftAway > 0;
      ftTotals.push(ftTotal);
      ftHomeSum += ftHome;
      ftAwaySum += ftAway;
      add(ftOutcomeCounts, ftOutcome);
      add(ftBttsCounts, btts ? "Igen" : "Nem");
      add(ftGoalCounts, bucket(ftTotal, 4));
      add(homeGoalCounts, bucket(ftHome, 3));
      add(awayGoalCounts, bucket(ftAway, 3));
      add(ftScoreCounts, `${ftHome}-${ftAway}`);
      if (ftAway === 0) add(cleanSheetCounts, "Hazai kapott gól nélkül");
      if (ftHome === 0) add(cleanSheetCounts, "Vendég kapott gól nélkül");
      add(bttsOver25Counts, `${btts ? "BTTS igen" : "BTTS nem"} · ${ftTotal > 2.5 ? "Over 2,5" : "Under 2,5"}`);
    }

    if (ht.status === "valid") {
      const htHome = ht.home;
      const htAway = ht.away;
      const htTotal = htHome + htAway;
      htTotals.push(htTotal);
      htHomeSum += htHome;
      htAwaySum += htAway;
      add(htOutcomeCounts, toOutcome(htHome, htAway));
      add(htBttsCounts, htHome > 0 && htAway > 0 ? "Igen" : "Nem");
      add(htGoalCounts, bucket(htTotal, 4));
      add(htScoreCounts, `${htHome}-${htAway}`);
    }

    if (ft.status !== "valid" || ht.status !== "valid") continue;
    const ftHome = ft.home, ftAway = ft.away, htHome = ht.home, htAway = ht.away;
    const htTotal = htHome + htAway;
    // Retain observed transitions as documented, with a separate inconsistency count.
    add(htftOutcomeCounts, `${toOutcome(htHome, htAway)}>${toOutcome(ftHome, ftAway)}`);
    add(htftScoreCounts, `${htHome}-${htAway}>${ftHome}-${ftAway}`);

    // A második félidős mutatókhoz csak olyan HT/FT párokat használunk,
    // amelyeknél a végeredmény mindkét csapatnál legalább a félidei állás.
    if (consistency !== "consistent") continue;
    const secondHalfHome = ftHome - htHome;
    const secondHalfAway = ftAway - htAway;
    const secondHalfTotal = secondHalfHome + secondHalfAway;
    secondHalfTotals.push(secondHalfTotal);
    secondHalfHomeSum += secondHalfHome;
    secondHalfAwaySum += secondHalfAway;
    add(secondHalfOutcomeCounts, toOutcome(secondHalfHome, secondHalfAway));
    add(secondHalfBttsCounts, secondHalfHome > 0 && secondHalfAway > 0 ? "Igen" : "Nem");
    add(secondHalfGoalCounts, bucket(secondHalfTotal, 4));
    add(halfWithMoreGoalsCounts, htTotal > secondHalfTotal ? "1. félidőben több" : htTotal < secondHalfTotal ? "2. félidőben több" : "Ugyanannyi");
  }

  const totalFtGoals = ftTotals.reduce((sum, value) => sum + value, 0);
  const totalHtGoals = htTotals.reduce((sum, value) => sum + value, 0);
  const totalSecondHalfGoals = secondHalfTotals.reduce((sum, value) => sum + value, 0);
  const { ftValid: validFt, htValid: validHt, htftValid: validHtFt, secondHalfValid: validSecondHalf } = samples;
  return {
    validFt,
    validHt,
    validHtFt,
    validSecondHalf,
    missingFt: samples.ftMissing,
    invalidFt: samples.ftInvalid,
    missingHt: samples.htMissing,
    invalidHt: samples.htInvalid,
    inconsistentHtFt: samples.htftInconsistent,
    averages: {
      ftTotal: mean(totalFtGoals, validFt),
      ftHome: mean(ftHomeSum, validFt),
      ftAway: mean(ftAwaySum, validFt),
      htTotal: mean(totalHtGoals, validHt),
      htHome: mean(htHomeSum, validHt),
      htAway: mean(htAwaySum, validHt),
      secondHalfTotal: mean(totalSecondHalfGoals, validSecondHalf),
      secondHalfHome: mean(secondHalfHomeSum, validSecondHalf),
      secondHalfAway: mean(secondHalfAwaySum, validSecondHalf),
    },
    ftOutcomes: frequencies(ftOutcomeCounts, validFt, ["H", "D", "A"]),
    htOutcomes: frequencies(htOutcomeCounts, validHt, ["H", "D", "A"]),
    secondHalfOutcomes: frequencies(secondHalfOutcomeCounts, validSecondHalf, ["H", "D", "A"]),
    halfWithMoreGoals: frequencies(halfWithMoreGoalsCounts, validSecondHalf, ["1. félidőben több", "Ugyanannyi", "2. félidőben több"]),
    ftBtts: frequencies(ftBttsCounts, validFt, ["Igen", "Nem"]),
    htBtts: frequencies(htBttsCounts, validHt, ["Igen", "Nem"]),
    secondHalfBtts: frequencies(secondHalfBttsCounts, validSecondHalf, ["Igen", "Nem"]),
    bttsOver25: frequencies(bttsOver25Counts, validFt),
    cleanSheets: frequencies(cleanSheetCounts, validFt),
    ftGoals: frequencies(ftGoalCounts, validFt, ["0", "1", "2", "3", "4", "5+"]),
    htGoals: frequencies(htGoalCounts, validHt, ["0", "1", "2", "3", "4", "5+"]),
    secondHalfGoals: frequencies(secondHalfGoalCounts, validSecondHalf, ["0", "1", "2", "3", "4", "5+"]),
    homeGoals: frequencies(homeGoalCounts, validFt, ["0", "1", "2", "3", "4+"]),
    awayGoals: frequencies(awayGoalCounts, validFt, ["0", "1", "2", "3", "4+"]),
    ftScores: frequencies(ftScoreCounts, validFt),
    htScores: frequencies(htScoreCounts, validHt),
    htftOutcomes: frequencies(htftOutcomeCounts, validHtFt),
    htftScores: frequencies(htftScoreCounts, validHtFt),
    ftGoalLines: goalLines(ftTotals),
    htGoalLines: goalLines(htTotals),
    secondHalfGoalLines: goalLines(secondHalfTotals),
  };
}
