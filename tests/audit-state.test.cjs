require('./helpers/register-ts.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { auditReducer, auditStatusLabel, initialAuditState } = require('../src/audit-state.ts');
const progress = { phase: 'download', percent: 41, completedFiles: 1, totalFiles: 3, completedMatches: 240, totalMatches: 720, loadedBytes: 10, totalBytes: 30, message: 'Downloading' };
const report = { sourceFileCount: 3, matchCount: 720, sourceBytes: 30, issueCount: 0 };
const start = (state = initialAuditState, runId = 1) => auditReducer(state, { type: 'start', runId, progress });
const event = (state, payload) => auditReducer(state, { type: 'worker', event: payload });

test('cancel never becomes complete, even with a late completion message', () => {
  let state = auditReducer(start(), { type: 'cancel', runId: 1 });
  assert.equal(state.status, 'cancelled');
  assert.equal(auditStatusLabel(state), 'Audit megszakítva');
  assert.equal(state.report, null);
  state = event(state, { type: 'complete', runId: 1, report });
  assert.equal(state.status, 'cancelled');
  assert.equal(state.progress.percent, 41);
  assert.equal(state.report, null);
});

test('old progress, errors and completions do not replace a new run', () => {
  const state = start(auditReducer(start(), { type: 'cancel', runId: 1 }), 2);
  for (const payload of [{ type: 'progress', progress }, { type: 'error', message: 'stale' }, { type: 'complete', report }]) {
    assert.equal(event(state, { ...payload, runId: 1 }), state);
  }
});

test('a retry and a failed run preserve the previous report', () => {
  let state = event(start(), { type: 'complete', runId: 1, report });
  assert.equal(state.progress.percent, 100);
  state = start(state, 2);
  state = event(state, { type: 'error', runId: 2, message: 'HTTP 503', filePath: 'season.json', retryable: true });
  assert.equal(state.status, 'failed');
  assert.equal(state.report, report);
  assert.equal(state.error.filePath, 'season.json');
});

test('100% is reserved for receipt of a complete report', () => {
  const state = event(start(), { type: 'progress', runId: 1, progress: { ...progress, percent: 100, phase: 'complete' } });
  assert.equal(state.progress.percent, 99);
  assert.equal(state.status, 'running');
  assert.equal(state.report, null);
});

test('a report containing quality issues has a distinct completion label', () => {
  const state = event(start(), { type: 'complete', runId: 1, report: { ...report, issueCount: 2 } });
  assert.match(auditStatusLabel(state), /adatminőségi eltérésekkel/);
});
