import type { AuditReport, Frequency } from "./types";
import { canonicalJson } from "./canonical";

function csvCell(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return `"${(text ?? "").replaceAll('"', '""')}"`;
}


function renderCsv(header: string[], rows: unknown[][], report: AuditReport, generatedAt: string): string {
  const metadata: Record<string, unknown> = { archive_commit: report.commitSha, run_id: report.runId,
    dataset_hash: report.datasetHash, source_hash: report.sourceHash, pipeline_version: report.pipelineVersion,
    configuration_json: report.config, completed_at: report.completedAt, generated_at: generatedAt,
    score_contract_version: report.scoreContractVersion, report_schema_version: report.reportSchemaVersion };
  // An empty selection still exports a standard CSV metadata row, with no fabricated match.
  const records = rows.length ? rows.map(row => [...row, "data"]) : [[...header.map(key => metadata[key] ?? ""), "metadata"]];
  return `\ufeff${[[...header, "row_type"], ...records].map(row => row.map(csvCell).join(",")).join("\r\n")}`;
}

export function pairsCsvContent(report: AuditReport, generatedAt = report.completedAt): string {
  const header = [
    "archive_commit", "league", "home_team", "away_team", "meetings_n", "valid_ft_n", "valid_ht_n", "missing_ht_n", "valid_second_half_n", "averages_json",
    "ft_result_distribution_json", "ht_result_distribution_json", "second_half_result_distribution_json", "half_with_more_goals_json", "btts_ft_json", "btts_ht_json", "btts_second_half_json",
    "btts_over_under_25_json", "clean_sheets_json", "ft_goal_lines_json", "ht_goal_lines_json", "second_half_goal_lines_json",
    "ft_total_goals_json", "ht_total_goals_json", "second_half_total_goals_json", "home_goals_json", "away_goals_json",
    "ft_exact_scores_json", "ht_exact_scores_json", "htft_outcomes_json", "htft_exact_scores_json",
    "top3_ft_scores_json", "top3_ht_scores_json", "top3_htft_outcomes_json", "top3_htft_exact_scores_json", "season_occurrences_json",
    "valid_htft_n", "invalid_ht_n", "missing_ft_n", "invalid_ft_n", "inconsistent_htft_n", "score_contract_version", "report_schema_version", "run_id", "dataset_hash", "source_hash", "pipeline_version", "configuration_json", "completed_at", "generated_at", "input_record_ids_json",
  ];
  const serialize = (items: Frequency[]) => items.map((item) => ({ key: item.key, count: item.count, rate: item.rate }));
  const rows = report.pairs.map((pair) => {
    const analysis = pair.analysis;
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
      report.runId,
      report.datasetHash,
      report.sourceHash, report.pipelineVersion, report.config, report.completedAt, generatedAt,
      pair.recordIds,
    ];
  });
  return renderCsv(header, rows, report, generatedAt);
}

export function matchesCsvContent(report: AuditReport, generatedAt = report.completedAt): string {
  const header = [
    "archive_commit", "dataset_hash", "match_id", "source_path", "source_blob_sha1", "league", "season_index", "season_name", "match_position", "round_no", "match_in_round",
    "virtual_time_hh_mm", "home_team", "away_team", "ht_home", "ht_away", "ft_home", "ft_away", "ht_outcome", "ft_outcome",
    "ht_status", "ft_status", "period_consistency", "score_contract_version", "report_schema_version",
    "run_id", "source_hash", "pipeline_version", "configuration_json", "completed_at", "generated_at",
    "season_key", "source_row", "source_content_hash", "import_version", "kickoff_iso", "kickoff_iso_status", "quality_status",
  ];
  const rows = report.matches.map((match) => [
    report.commitSha,
    report.datasetHash,
    match.id,
    match.sourcePath,
    match.sourceHash,
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
    report.runId, report.sourceHash, report.pipelineVersion, report.config, report.completedAt, generatedAt,
    match.seasonKey, match.sourceRow, match.sourceContentHash, match.importVersion, match.kickoffIso, match.kickoffIsoStatus, match.qualityStatus,
  ]);
  return renderCsv(header, rows, report, generatedAt);
}

export function auditJsonContent(report: AuditReport, generatedAt = report.completedAt): string {
  return canonicalJson({ ...report, generatedAt });
}

export function quarantineJsonlContent(report: AuditReport, generatedAt = report.completedAt): string {
  return [canonicalJson({ type: "metadata", datasetHash: report.datasetHash, sourceHash: report.sourceHash,
    pipelineVersion: report.pipelineVersion, scoreContractVersion: report.scoreContractVersion,
    runId: report.runId, config: report.config, generatedAt, entryCount: report.quarantine.length }),
    ...report.quarantine.map(entry => canonicalJson({ type: "quarantine", ...entry }))].join("\n") + "\n";
}
