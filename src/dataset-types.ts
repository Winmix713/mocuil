import type { ArchiveManifest, ArchiveSeasonFile, League, MatchRecord, SeasonQuality } from "./types";

export const PIPELINE_VERSION = "1.0.0";
export const DATASET_SCHEMA_VERSION = 1;
export const REPORT_SCHEMA_VERSION = 3;

export interface VerifiedSource extends ArchiveSeasonFile {
  /** SHA-256 of the verified original bytes; sha remains the Git-blob SHA-1. */
  sha256: string;
}

export interface QuarantineEntry {
  id: string;
  sourcePath: string;
  sourceHash: string;
  sourceRow: number | null;
  recordId: string | null;
  importVersion: string;
  scope: "season" | "match";
  disposition: "excluded" | "retained";
  reasonCodes: string[];
  /** Exact parsed source row, including invalid values, or undecodable JSON text. */
  raw: unknown;
}

export interface NormalizedSeason {
  id: string | null;
  league: League;
  seasonIndex: number;
  seasonName: string;
  sourcePath: string;
  sourceHash: string;
  /** Source-declared contentHash, not a cryptographic integrity guarantee. */
  sourceContentHash: string | null;
  importVersion: string;
  status: "valid" | "invalid";
}

export interface NormalizedBatch {
  source: VerifiedSource;
  /** Kept only until cross-file identity validation; never stored for clean sources. */
  raw: unknown;
  season: NormalizedSeason;
  sourceRecordCount: number;
  matches: MatchRecord[];
  quarantine: QuarantineEntry[];
  issues: string[];
  duplicatePositions: number;
}

export interface DatasetQuality {
  sourceRecordCount: number;
  acceptedRecordCount: number;
  excludedRecordCount: number;
  quarantinedEntries: number;
  retainedFlaggedRecords: number;
  missingKickoffIso: number;
  invalidKickoffIso: number;
  importErrorRate: number;
  seasons: SeasonQuality[];
}

export interface NormalizedDataset {
  schemaVersion: 1;
  pipelineVersion: string;
  scoreContractVersion: string;
  sourceHash: string;
  datasetHash: string;
  manifest: ArchiveManifest;
  sources: VerifiedSource[];
  leagues: { id: League; name: string }[];
  teams: { id: string; league: League; name: string }[];
  seasons: NormalizedSeason[];
  matches: MatchRecord[];
  quarantine: QuarantineEntry[];
  quality: DatasetQuality;
}

export interface AuditConfig {
  leagues: League[];
  /** Empty arrays mean all seasons/rounds. Season keys are source IDs. */
  seasonKeys: string[];
  rounds: number[];
  pair: { league: League; homeTeam: string; awayTeam: string } | null;
  minPairSamples: number;
  ft: "any" | "valid";
  ht: "any" | "valid";
  secondHalf: "any" | "valid";
}

export interface AuditExclusion {
  scope: "record" | "metric";
  recordId: string;
  reasons: string[];
}

export interface ReproductionSpec {
  datasetHash: string;
  pipelineVersion: string;
  scoreContractVersion: string;
  runId: string;
  config: AuditConfig;
  manifest: ArchiveManifest;
}
