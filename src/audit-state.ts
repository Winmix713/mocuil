import type { AuditProgress, AuditReport, WorkerEvent } from "./types";

export type AuditStatus = "idle" | "running" | "completed" | "cancelled" | "failed";
export interface AuditRunState {
  runId: number;
  status: AuditStatus;
  progress: AuditProgress | null;
  error: { message: string; filePath?: string } | null;
  /** The last complete report survives a retry, failure or cancellation. */
  report: AuditReport | null;
}
export const initialAuditState: AuditRunState = { runId: 0, status: "idle", progress: null, error: null, report: null };
export type AuditAction =
  | { type: "start"; runId: number; progress: AuditProgress }
  | { type: "worker"; event: WorkerEvent }
  | { type: "cancel"; runId: number }
  | { type: "dismiss" };

export function auditStatusLabel(state: AuditRunState): string {
  if (state.status === "running") return "Teljes történeti audit fut";
  if (state.status === "cancelled") return "Audit megszakítva";
  if (state.status === "failed") return "Az audit nem fejeződött be";
  if (state.status === "completed") return state.report?.issueCount ? "Audit kész · adatminőségi eltérésekkel" : "Audit befejezve";
  return "Készen áll";
}

export function auditReducer(state: AuditRunState, action: AuditAction): AuditRunState {
  if (action.type === "start") {
    if (state.status === "running" || action.runId <= state.runId) return state;
    return { ...state, runId: action.runId, status: "running", progress: action.progress, error: null };
  }
  if (action.type === "dismiss") {
    return state.status === "cancelled" ? { ...state, status: "idle", progress: null } : state;
  }
  const runId = action.type === "worker" ? action.event.runId : action.runId;
  if (runId !== state.runId || state.status !== "running") return state;
  if (action.type === "cancel" || (action.type === "worker" && action.event.type === "cancelled")) {
    return { ...state, status: "cancelled", progress: state.progress ? { ...state.progress, phase: "cancelled", message: "Az auditot megszakítottad; nem készült új riport." } : null };
  }
  if (action.type !== "worker") return state;
  const event = action.event;
  if (event.type === "progress") return { ...state, progress: { ...event.progress, percent: Math.min(99, event.progress.percent) } };
  if (event.type === "error") return { ...state, status: "failed", error: { message: event.message, filePath: event.filePath } };
  if (event.type === "complete") {
    const report = event.report;
    return {
      ...state, status: "completed", report, error: null,
      progress: { phase: "complete", percent: 100, completedFiles: report.sourceFileCount, totalFiles: report.sourceFileCount, completedMatches: report.matchCount, totalMatches: report.matchCount, loadedBytes: report.sourceBytes, totalBytes: report.sourceBytes, message: report.issueCount ? `A feldolgozás kész; ${report.issueCount} adatminőségi eltérés található.` : "Az audit teljes." },
    };
  }
  return state;
}
