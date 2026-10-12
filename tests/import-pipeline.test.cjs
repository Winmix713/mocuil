require('./helpers/register-ts.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fc = require('fast-check');
const { archive, season } = require('./helpers/fixtures.cjs');
const { ingestSeason, buildDataset } = require('../src/import-pipeline.ts');
const { normalizeMatch } = require('../src/audit-core.ts');
const { createAuditReport, normalizeAuditConfig } = require('../src/audit-engine.ts');
const { analyzePairMatches } = require('../src/pair-analysis.ts');
const { pairsCsvContent, matchesCsvContent, quarantineJsonlContent } = require('../src/audit-export.ts');
const { runWorker } = require('./helpers/worker.cjs');
const timestamp = '2026-10-11T10:00:00.000Z';

async function importArchive(input) {
  const batches = await Promise.all(input.manifest.files.map(file => ingestSeason(file, Buffer.from(input.bodies[file.path]))));
  return { batches, dataset: await buildDataset(input.manifest, batches) };
}

test('stable match IDs use source season IDs, not mutable display indexes or team labels', () => {
  const input = archive([season()]);
  const file = input.manifest.files[0], raw = season().matches[0];
  const first = normalizeMatch(file, 'season:source/1', raw, 9, 'source-content').record;
  const changed = normalizeMatch({ ...file, seasonIndex: 99, seasonName: 'Renamed' }, 'season:source/1', { ...raw, home_team: 'Other' }, 10).record;
  assert.equal(first.id, changed.id);
  assert.notEqual(first.id, normalizeMatch(file, 'different', raw).record.id);
  assert.equal(first.sourceRow, 9);
  assert.equal(first.sourceContentHash, 'source-content');
  assert.equal(first.kickoffIso, null);
  assert.equal(first.kickoffIsoStatus, 'missing');
});

test('normalization preserves raw invalid values and quarantines every ambiguous identity', async () => {
  const source = season();
  source.matches[0].match_no = source.matches[1].match_no;
  source.matches[2].home_team = source.matches[2].away_team;
  source.matches[3].match_no = 241;
  source.matches[4] = null;
  source.matches[5].ht_home_score = 'invalid-score';
  source.matches[5].pipeline = { ignoredPrediction: 0.999 };
  const before = JSON.stringify(source);
  const { dataset } = await importArchive(archive([source]));
  assert.equal(JSON.stringify(source), before);
  assert.equal(dataset.matches.length, 235);
  assert.equal(dataset.quality.excludedRecordCount, 5);
  assert.equal(dataset.quarantine.filter(q => q.reasonCodes.includes('DUPLICATE_MATCH_ID')).length, 2);
  const invalid = dataset.quarantine.find(q => q.reasonCodes.includes('HT_INVALID'));
  assert.equal(invalid.disposition, 'retained');
  assert.deepEqual(invalid.raw, source.matches[5]);
  assert.equal(dataset.matches.find(m => m.matchPosition === 6).ftStatus, 'valid');
  assert.equal(dataset.matches.some(m => m.matchPosition === 2), false);
  assert.equal(new Set(dataset.matches.map(m => m.id)).size, dataset.matches.length);
});

test('cross-file duplicate season IDs quarantine all conflicting sources without mutating batches', async () => {
  const a = season(1), b = season(2); b.id = a.id;
  const input = archive([a, b]);
  const { dataset, batches } = await importArchive(input);
  assert.equal(batches[0].matches.length, 240);
  assert.equal(dataset.matches.length, 0);
  assert.equal(dataset.quality.excludedRecordCount, 480);
  assert.equal(dataset.quarantine.length, 2);
  assert.deepEqual(dataset.quarantine[1].raw, b);
  assert.ok(dataset.quarantine.every(q => q.reasonCodes.includes('DUPLICATE_SEASON_ID')));
});

test('invalid season envelopes are isolated while clean files remain usable', async () => {
  const a = season(1), b = season(2); delete b.id;
  const { dataset } = await importArchive(archive([a, b]));
  assert.equal(dataset.matches.length, 240);
  assert.equal(dataset.quarantine[0].scope, 'season');
  assert.ok(dataset.quarantine[0].reasonCodes.includes('MISSING_SEASON_ID'));
  assert.deepEqual(dataset.quarantine[0].raw, b);
});

test('missing kickoff stays missing; invalid calendar dates and virtual times are not ISO dates', () => {
  const file = archive([season()]).manifest.files[0], raw = season().matches[0];
  for (const kickoffIso of ['06:15', '2026-02-30T06:00:00Z', '2026-10-11', '2026-10-11T06:00:00']) {
    assert.equal(normalizeMatch(file, 's', { ...raw, kickoffIso }).record.kickoffIsoStatus, 'invalid');
  }
  assert.equal(normalizeMatch(file, 's', { ...raw, kickoffIso: '2024-02-29T06:00:00+02:00' }).record.kickoffIsoStatus, 'valid');
});

test('dataset and run hashes depend on verified content and normalized configuration, not wall-clock time', async () => {
  const input = archive([season(1), season(2), season(1, 'spanyol')]);
  const { dataset, batches } = await importArchive(input);
  const reversedManifest = { ...input.manifest, files: [...input.manifest.files].reverse() };
  assert.deepEqual(await buildDataset(reversedManifest, [...batches].reverse()), dataset);
  const a = await createAuditReport(dataset, { leagues: ['spanyol', 'angol', 'angol'], rounds: [2, 1, 2] }, timestamp);
  const b = await createAuditReport(dataset, { rounds: [1, 2] }, '2026-10-12T10:00:00Z');
  assert.equal(a.runId, b.runId);
  assert.notEqual(a.completedAt, b.completedAt);
  assert.notEqual(a.runId, (await createAuditReport(dataset, { rounds: [1] }, timestamp)).runId);
  const mutated = season(1); mutated.matches[0].home_score = 4;
  const changed = (await importArchive(archive([mutated, season(2), season(1, 'spanyol')]))).dataset;
  assert.notEqual(dataset.sourceHash, changed.sourceHash);
  assert.notEqual(dataset.datasetHash, changed.datasetHash);
  assert.notEqual((await createAuditReport(changed, {}, timestamp)).runId, (await createAuditReport(dataset, {}, timestamp)).runId);
});

test('config filters have explicit record exclusions and scoped denominators', async () => {
  const input = archive([season(1), season(2), season(1, 'spanyol')]);
  const { dataset } = await importArchive(input);
  const config = { leagues: ['angol'], seasonKeys: ['angol-1'], rounds: [1], minPairSamples: 1, ht: 'valid' };
  const report = await createAuditReport(dataset, config, timestamp);
  assert.equal(report.matchCount, 8);
  assert.equal(report.ftValid, 8);
  assert.equal(report.leagues.spanyol.matches, 0);
  assert.equal(report.inputRecordIds.length, 720);
  assert.equal(report.exclusions.filter(e => e.scope === 'record').length, 712);
  assert.equal(report.matches.length + report.exclusions.filter(e => e.scope === 'record').length, dataset.matches.length);
  const empty = await createAuditReport(dataset, { ...config, minPairSamples: 2 }, timestamp);
  assert.equal(empty.matches.length, 0);
  for (const content of [pairsCsvContent(empty), matchesCsvContent(empty)]) {
    assert.ok(content.includes(empty.runId));
    assert.ok(content.includes('"metadata"'));
  }
  assert.equal(empty.exclusions.filter(e => e.reasons.includes('MIN_PAIR_SAMPLES')).length, 8);
  assert.throws(() => normalizeAuditConfig({ leauges: ['angol'] }), /Ismeretlen/);
  assert.throws(() => normalizeAuditConfig({ leagues: [] }), /ligaszűrő/);
  await assert.rejects(createAuditReport(dataset, { seasonKeys: ['missing'] }, timestamp), /Ismeretlen szezon/);
});

test('Node and actual Worker return identical reports and expose reproduction/export metadata', async () => {
  const input = archive([season(1), season(2)]);
  const { dataset } = await importArchive(input);
  const worker = await runWorker(input);
  assert.equal(worker.type, 'complete');
  const direct = await createAuditReport(dataset, {}, worker.report.completedAt);
  assert.deepEqual(worker.report, direct);
  for (const exportCsv of [pairsCsvContent, matchesCsvContent]) {
    const csv = exportCsv(direct);
    for (const field of ['run_id', 'dataset_hash', 'source_hash', 'pipeline_version', 'configuration_json', 'generated_at']) assert.ok(csv.split('\r\n')[0].includes(`"${field}"`));
    assert.ok(csv.includes(direct.runId));
    const headers = csv.split('\r\n')[0].split(',');
    assert.equal(new Set(headers).size, headers.length, 'CSV header names must be unique');
  }
  const metadata = JSON.parse(quarantineJsonlContent(direct).trim());
  assert.equal(metadata.entryCount, 0);
  assert.equal(metadata.datasetHash, dataset.datasetHash);
  const reproduced = await runWorker({ ...input, reproduce: direct.reproduction });
  assert.equal(reproduced.type, 'complete');
  assert.equal(reproduced.report.runId, direct.runId);
  assert.equal(reproduced.messages.some(m => m.kind === 'request' && m.url === '/archive-manifest.json'), false);
  const mismatch = await runWorker({ ...input, reproduce: { ...direct.reproduction, datasetHash: 'sha256:wrong' } });
  assert.equal(mismatch.type, 'error');
  assert.match(mismatch.message, /Reprodukálási eltérés/);
  const oldVersion = await runWorker({ ...input, reproduce: { ...direct.reproduction, pipelineVersion: '0.0.0' } });
  assert.equal(oldVersion.type, 'error');
  assert.equal(oldVersion.messages.some(m => m.kind === 'request'), false);
});

test('property: independent denominators, transitions and goal-line partitions hold for arbitrary dirty scores', () => {
  const value = fc.oneof(fc.integer({ min: -2, max: 9 }), fc.constant(null), fc.constant('1'), fc.constant(0.5));
  const raw = fc.record({ home_score: value, away_score: value, ht_home_score: value, ht_away_score: value });
  const file = archive([season()]).manifest.files[0];
  fc.assert(fc.property(fc.array(raw, { maxLength: 100 }), values => {
    const matches = values.map((scores, i) => normalizeMatch(file, 'generated', { ...scores, match_no: i + 1, home_team: 'H', away_team: 'A' }).record);
    const analysis = analyzePairMatches(matches);
    const valid = v => Number.isSafeInteger(v) && v >= 0;
    const validFt = values.filter(v => valid(v.home_score) && valid(v.away_score)).length;
    const validHt = values.filter(v => valid(v.ht_home_score) && valid(v.ht_away_score)).length;
    const joint = values.filter(v => valid(v.home_score) && valid(v.away_score) && valid(v.ht_home_score) && valid(v.ht_away_score));
    assert.equal(analysis.validFt, validFt); assert.equal(analysis.validHt, validHt);
    assert.equal(analysis.validFt + analysis.missingFt + analysis.invalidFt, values.length);
    assert.equal(analysis.validHt + analysis.missingHt + analysis.invalidHt, values.length);
    assert.equal(analysis.htftScores.reduce((n, v) => n + v.count, 0), joint.length);
    assert.equal(analysis.validSecondHalf + analysis.inconsistentHtFt, joint.length);
    for (const [rows, n] of [[analysis.ftScores, validFt], [analysis.htScores, validHt], [analysis.htftOutcomes, joint.length]]) {
      assert.equal(rows.reduce((sum, v) => sum + v.count, 0), n);
      assert.ok(rows.every(v => v.rate >= 0 && v.rate <= 1));
      if (n) assert.ok(Math.abs(rows.reduce((sum, v) => sum + v.rate, 0) - 1) < 1e-12);
    }
    for (const [rows, n] of [[analysis.ftGoalLines, validFt], [analysis.htGoalLines, validHt], [analysis.secondHalfGoalLines, analysis.validSecondHalf]]) {
      for (const row of rows) { assert.equal(row.overCount + row.underCount, n); assert.equal(row.overRate + row.underRate, 1); }
    }
    assert.deepEqual(analyzePairMatches([...matches].reverse()), analysis);
  }), { seed: 20261011, numRuns: 300 });
});

test('property: file completion order never changes dataset hashes or baseline quality flags', async () => {
  const s = season(2); s.matches[0].home_team = 'Different';
  const input = archive([season(1), s, season(3)]);
  const { dataset, batches } = await importArchive(input);
  await fc.assert(fc.asyncProperty(fc.shuffledSubarray(batches, { minLength: 3, maxLength: 3 }), async order => {
    const reordered = await buildDataset({ ...input.manifest, files: order.map(batch => input.manifest.files.find(f => f.path === batch.source.path)) }, order);
    assert.equal(reordered.datasetHash, dataset.datasetHash);
    assert.deepEqual(reordered.quality, dataset.quality);
  }), { seed: 20261011, numRuns: 30 });
});


test('verified malformed JSON and UTF-8 preserve their original content in quarantine', async () => {
  const { createHash } = require('node:crypto');
  const template = archive([season()]).manifest.files[0];
  for (const bytes of [Buffer.from('{bad-json'), Buffer.from([0xff, 0xfe, 0x80])]) {
    const file = { ...template, size: bytes.length, sha: createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') };
    const batch = await ingestSeason(file, bytes);
    assert.equal(batch.matches.length, 0);
    assert.equal(batch.quarantine.length, 1);
    const q = batch.quarantine[0];
    assert.equal(q.disposition, 'excluded');
    if (q.reasonCodes.includes('INVALID_UTF8')) assert.deepEqual(Buffer.from(q.raw.data, 'base64'), bytes);
    else { assert.ok(q.reasonCodes.includes('INVALID_JSON')); assert.equal(q.raw, bytes.toString('utf8')); }
  }
});
