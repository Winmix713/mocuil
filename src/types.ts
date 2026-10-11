export type League = "angol" | "spanyol";
export type LeagueFilter = League | "mindkettő";
export type Outcome = "H" | "D" | "A";
export type ScoreStatus = "valid" | "missing" | "invalid";
export type PeriodConsistency = "consistent" | "inconsistent" | "unavailable";

export interface ScoreSampleCounts {
  ftValid: number;
  ftMissing: number;
  ftInvalid: number;
  htValid: number;
  htMissing: number;
  htInvalid: number;
  /** Both period scores are valid numbers; includes flagged inconsistent observations. */
  htftValid: number;
  htftInconsistent: number;
  secondHalfValid: number;
}

export interface ArchiveSeasonFile {
  path: string;
  url: string;
  sha: string;
  size: number;
  league: League;
  seasonIndex: number;
  seasonName: string;
}

export interface ArchiveManifest {
  source: string;
  commitSha: string;
  treeSha: string;
  exportedAt: string;
  schemaVersion: number;
  seasonCount: number;
  expectedByteCount: number;
  files: ArchiveSeasonFile[];
}

export interface MatchRecord {
  id: string;
  sourcePath: string;
  sourceHash: string;
  league: League;
  seasonIndex: number;
  seasonName: string;
  seasonKey: string;
  matchPosition: number;
  roundNo: number;
  matchInRound: number;
  virtualTime: string | null;
  homeTeam: string;
  awayTeam: string;
  htHome: number | null;
  htAway: number | null;
  ftHome: number | null;
  ftAway: number | null;
  ftOutcome: Outcome | null;
  htOutcome: Outcome | null;
  ftStatus: ScoreStatus;
  htStatus: ScoreStatus;
  periodConsistency: PeriodConsistency;
}

export interface Frequency {
  key: string;
  count: number;
  rate: number;
}

export interface SeasonBreakdown extends ScoreSampleCounts {
  seasonIndex: number;
  seasonName: string;
  matches: number;
}

export interface PairSummary extends ScoreSampleCounts {
  league: League;
  homeTeam: string;
  awayTeam: string;
  matches: number;
  ftScores: Frequency[];
  htftOutcomes: Frequency[];
  htftScores: Frequency[];
  seasons: SeasonBreakdown[];
}

export interface PositionSummary extends ScoreSampleCounts {
  league: League;
  matchPosition: number;
  roundNo: number;
  matchInRound: number;
  observations: number;
  ftOutcomes: Frequency[];
  htftOutcomes: Frequency[];
  topPairs: Frequency[];
}

export interface SeasonQuality extends ScoreSampleCounts {
  league: League;
  seasonIndex: number;
  seasonName: string;
  filePath: string;
  fileBytes: number;
  fileHashValid: boolean;
  matches: number;
  teams: number;
  orderedPairs: number;
  skippedRecords: number;
  duplicatePositions: number;
  missingPositions: number;
  pairSetMatches: boolean;
  roundBlocksValid: boolean;
  issueCount: number;
  issues: string[];
}

export interface LeagueSummary extends ScoreSampleCounts {
  league: League;
  seasonCount: number;
  matches: number;
  pairCount: number;
  eachSeasonHas240: boolean;
  eachSeasonHas16Teams: boolean;
  eachSeasonHas240Pairs: boolean;
  identicalPairSets: boolean;
  roundBlocksValid: boolean;
}

export interface AuditReport extends ScoreSampleCounts {
  reportSchemaVersion: 2;
  runId: string;
  datasetHash: string;
  scoreContractVersion: string;
  completedAt: string;
  source: string;
  commitSha: string;
  treeSha: string;
  exportedAt: string;
  sourceFileCount: number;
  sourceBytes: number;
  matchCount: number;
  skippedRecords: number;
  checksumFailures: number;
  issueCount: number;
  roundBlocksValid: boolean;
  pairSetsIdentical: boolean;
  leagues: Record<League, LeagueSummary>;
  pairs: PairSummary[];
  positions: PositionSummary[];
  seasons: SeasonQuality[];
  matches: MatchRecord[];
}

export interface AuditProgress {
  phase: string;
  percent: number;
  completedFiles: number;
  totalFiles: number;
  completedMatches: number;
  totalMatches: number;
  loadedBytes: number;
  totalBytes: number;
  message: string;
}

export type WorkerMessage =
  | { type: "start"; runId: number }
  | { type: "cancel"; runId: number };

export type WorkerEventPayload =
  | { type: "progress"; progress: AuditProgress }
  | { type: "complete"; report: AuditReport }
  | { type: "error"; message: string; filePath?: string; retryable: boolean }
  | { type: "cancelled" };

export type WorkerEvent = WorkerEventPayload & { runId: number };
