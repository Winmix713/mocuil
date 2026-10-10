import type { AuditReport, Frequency } from "./types";
import { analyzePairMatches } from "./pair-analysis";

function csvCell(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return `"${(text ?? "").replaceAll('"', '""')}"`;
}

export function pairsCsvContent(report: AuditReport): string {
  const header = [
    "archive_commit", "league", "home_team", "away_team", "meetings_n", "valid_ft_n", "valid_ht_n", "missing_ht_n", "valid_second_half_n", "averages_json",
    "ft_result_distribution_json", "ht_result_distribution_json", "second_half_result_distribution_json", "half_with_more_goals_json", "btts_ft_json", "btts_ht_json", "btts_second_half_json",
    "btts_over_under_25_json", "clean_sheets_json", "ft_goal_lines_json", "ht_goal_lines_json", "second_half_goal_lines_json",
    "ft_total_goals_json", "ht_total_goals_json", "second_half_total_goals_json", "home_goals_json", "away_goals_json",
    "ft_exact_scores_json", "ht_exact_scores_json", "htft_outcomes_json", "htft_exact_scores_json",
    "top3_ft_scores_json", "top3_ht_scores_json", "top3_htft_outcomes_json", "top3_htft_exact_scores_json", "season_occurrences_json",
    "valid_htft_n", "invalid_ht_n", "missing_ft_n", "invalid_ft_n", "inconsistent_htft_n", "score_contract_version", "report_schema_version",
  ];
  const matchesByPair = new Map<string, AuditReport["matches"]>();
  for (const match of report.matches) {
    const key = JSON.stringify([match.league, match.homeTeam, match.awayTeam]);
    const matches = matchesByPair.get(key) ?? [];
    matches.push(match);
    matchesByPair.set(key, matches);
  }
  const serialize = (items: Frequency[]) => items.map((item) => ({ key: item.key, count: item.count, rate: item.rate }));
  const rows = report.pairs.map((pair) => {
    const key = JSON.stringify([pair.league, pair.homeTeam, pair.awayTeam]);
    const analysis = analyzePairMatches(matchesByPair.get(key) ?? []);
    return [
      report.commitSha,
      pair.league,
      pair.homeTeam,
      pair.awayTeam,
      pair.matches,
      analysis.validFt,
      analysis.validHt,
      analysis.missingHt,
      analysis.validSecondHalf,
      analysis.averages,
      serialize(analysis.ftOutcomes),
      serialize(analysis.htOutcomes),
      serialize(analysis.secondHalfOutcomes),
      serialize(analysis.halfWithMoreGoals),
      serialize(analysis.ftBtts),
      serialize(analysis.htBtts),
      serialize(analysis.secondHalfBtts),
      serialize(analysis.bttsOver25),
      serialize(analysis.cleanSheets),
      analysis.ftGoalLines,
      analysis.htGoalLines,
      analysis.secondHalfGoalLines,
      serialize(analysis.ftGoals),
      serialize(analysis.htGoals),
      serialize(analysis.secondHalfGoals),
      serialize(analysis.homeGoals),
      serialize(analysis.awayGoals),
      serialize(analysis.ftScores),
      serialize(analysis.htScores),
      serialize(analysis.htftOutcomes),
      serialize(analysis.htftScores),
      serialize(analysis.ftScores.slice(0, 3)),
      serialize(analysis.htScores.slice(0, 3)),
      serialize(analysis.htftOutcomes.slice(0, 3)),
      serialize(analysis.htftScores.slice(0, 3)),
      pair.seasons,
      analysis.validHtFt,
      analysis.invalidHt,
      analysis.missingFt,
      analysis.invalidFt,
      analysis.inconsistentHtFt,
      report.scoreContractVersion,
      report.reportSchemaVersion,
    ];
  });
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  return `\ufeff${csv}`;
}

export function matchesCsvContent(report: AuditReport): string {
  const header = [
    "archive_commit", "league", "season_index", "season_name", "match_position", "round_no", "match_in_round",
    "virtual_time_hh_mm", "home_team", "away_team", "ht_home", "ht_away", "ft_home", "ft_away", "ht_outcome", "ft_outcome",
    "ht_status", "ft_status", "period_consistency", "score_contract_version", "report_schema_version",
  ];
  const rows = report.matches.map((match) => [
    report.commitSha,
    match.league,
    match.seasonIndex,
    match.seasonName,
    match.matchPosition,
    match.roundNo,
    match.matchInRound,
    match.virtualTime ?? "",
    match.homeTeam,
    match.awayTeam,
    match.htHome ?? "",
    match.htAway ?? "",
    match.ftHome ?? "",
    match.ftAway ?? "",
    match.htOutcome ?? (match.htStatus === "invalid" ? "HT érvénytelen" : "HT hiányzik"),
    match.ftOutcome ?? (match.ftStatus === "invalid" ? "FT érvénytelen" : "FT hiányzik"),
    match.htStatus,
    match.ftStatus,
    match.periodConsistency,
    report.scoreContractVersion,
    report.reportSchemaVersion,
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  return `\ufeff${csv}`;
}
