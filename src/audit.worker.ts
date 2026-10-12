import type { ArchiveManifest, ArchiveSeasonFile, WorkerEvent, WorkerEventPayload, WorkerMessage } from "./types";
import type { NormalizedBatch } from "./dataset-types";
import { buildDataset, ingestSeason, validateManifest } from "./import-pipeline";
import { assertReproduced, assertReproductionVersion, createAuditReport, normalizeAuditConfig } from "./audit-engine";

interface WorkerScope {
  postMessage: (event: WorkerEvent) => void;
  onmessage: ((event: MessageEvent<WorkerMessage>) => void) | null;
}
const scope = self as unknown as WorkerScope;
let cancelled = false;
let activeControllers: AbortController[] = [];
let activeRunId = 0;
let running = false;
let manifest: ArchiveManifest | null = null;
let seasonBytesLoaded: number[] = [];
let completedFiles = 0;
let completedMatches = 0;
let lastProgressSentAt = 0;
let lastPercent = 0;
const emit = (event: WorkerEventPayload) => scope.postMessage({ ...event, runId: activeRunId });
const checkCancelled = () => { if (cancelled) throw new DOMException("Audit cancelled", "AbortError"); };

const reportProgress = (phase: string, message: string, force = false) => {
  if (!manifest) return;
  const now = performance.now();
  if (!force && now - lastProgressSentAt < 90) return;
  lastProgressSentAt = now;
  const loadedBytes = Math.min(manifest.expectedByteCount, seasonBytesLoaded.reduce((sum, value) => sum + value, 0));
  const transfer = manifest.expectedByteCount ? loadedBytes / manifest.expectedByteCount : 0;
  const percent = phase === "download" ? 5 + transfer * 70 : phase === "validation" ? 80 : phase === "aggregation" ? 95 : 3;
  lastPercent = Math.min(99, Math.max(lastPercent, percent));
  emit({ type: "progress", progress: { phase, percent: lastPercent, completedFiles, totalFiles: manifest.files.length,
    completedMatches, totalMatches: manifest.files.length * 240, loadedBytes, totalBytes: manifest.expectedByteCount, message } });
};

/** Transport only: byte verification, parsing and normalization live in the shared core. */
async function downloadSeason(file: ArchiveSeasonFile, index: number): Promise<NormalizedBatch> {
  const controller = new AbortController();
  activeControllers.push(controller);
  let lastError: unknown;
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      checkCancelled();
      try {
        const response = await fetch(file.url, { mode: "cors", cache: "force-cache", signal: controller.signal, headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
        if (!response.body) throw new Error("A böngésző nem adott olvasható adatfolyamot.");
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let length = 0;
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          chunks.push(part.value); length += part.value.byteLength;
          if (length > file.size) { await reader.cancel(); throw new Error(`Méreteltérés: a forrás meghaladja a várt ${file.size} bájtot.`); }
          seasonBytesLoaded[index] = length;
          reportProgress("download", `Letöltés és feldolgozás: ${file.league} · ${file.seasonName}`);
        }
        const bytes = new Uint8Array(length);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        const batch = await ingestSeason(file, bytes);
        checkCancelled();
        return batch;
      } catch (error) {
        lastError = error;
        if (cancelled || controller.signal.aborted) throw error;
        if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  } finally { activeControllers = activeControllers.filter(active => active !== controller); }
}

async function runAudit(request: Extract<WorkerMessage, { type: "start" }>) {
  cancelled = false; activeControllers = []; completedFiles = 0; completedMatches = 0;
  lastProgressSentAt = 0; lastPercent = 0; seasonBytesLoaded = []; manifest = null;
  if (request.reproduce) assertReproductionVersion(request.reproduce);
  const config = normalizeAuditConfig(request.reproduce?.config ?? request.config);
  if (request.reproduce) {
    validateManifest(request.reproduce.manifest);
    manifest = request.reproduce.manifest;
  } else {
    const controller = new AbortController();
    activeControllers.push(controller);
    const response = await fetch("/archive-manifest.json", { cache: "no-cache", signal: controller.signal });
    if (!response.ok) throw new Error(`Az archívummanifeszt nem érhető el (HTTP ${response.status}).`);
    const data: unknown = await response.json();
    validateManifest(data);
    manifest = data;
    activeControllers = activeControllers.filter(active => active !== controller);
  }
  checkCancelled();
  seasonBytesLoaded = manifest.files.map(() => 0);
  const batches: NormalizedBatch[] = [];
  let nextIndex = 0;
  const errorState: { current: { message: string; filePath: string } | null } = { current: null };
  reportProgress("download", `${manifest.files.length} szezonfájl ellenőrzése és normalizálása indul.`, true);
  const processNext = async () => {
    while (!cancelled && !errorState.current) {
      const file = manifest!.files[nextIndex];
      const index = nextIndex++;
      if (!file) return;
      try {
        const batch = await downloadSeason(file, index);
        checkCancelled();
        batches.push(batch); completedFiles++; completedMatches += batch.sourceRecordCount;
        reportProgress("download", `Feldolgozva: ${file.league} · ${file.seasonName}`, true);
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        if (!errorState.current) errorState.current = { message: error instanceof Error ? error.message : String(error), filePath: file.path };
        activeControllers.forEach(controller => controller.abort());
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, manifest.files.length) }, processNext));
  checkCancelled();
  if (errorState.current) { emit({ type: "error", ...errorState.current, retryable: true }); return; }
  reportProgress("validation", "Stabil azonosítók, duplikációk, források és dataset-hash ellenőrzése…", true);
  const dataset = await buildDataset(manifest, batches);
  batches.length = 0; // Release clean original rows; quarantine preserves only rejected/flagged source data.
  checkCancelled();
  reportProgress("aggregation", "A közös számítási mag összesíti az audit konfigurációjának megfelelő mintát…", true);
  const report = await createAuditReport(dataset, config, new Date().toISOString());
  checkCancelled();
  if (request.reproduce) assertReproduced(request.reproduce, report);
  emit({ type: "complete", report });
}

scope.onmessage = event => {
  if (event.data.type === "cancel" && event.data.runId === activeRunId) {
    cancelled = true; activeControllers.forEach(controller => controller.abort()); return;
  }
  if (event.data.type === "start") {
    if (running) return;
    activeRunId = event.data.runId; running = true;
    void runAudit(event.data).catch((error: unknown) => {
      if (cancelled) emit({ type: "cancelled" });
      else emit({ type: "error", message: error instanceof Error ? error.message : String(error), retryable: true });
    }).finally(() => { running = false; activeControllers = []; });
  }
};
