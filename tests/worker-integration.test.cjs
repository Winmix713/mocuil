require('./helpers/register-ts.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { runWorker } = require('./helpers/worker.cjs');
const { archive, season } = require('./helpers/fixtures.cjs');
const { analyzePairMatches } = require('../src/pair-analysis.ts');
const { pairsCsvContent, matchesCsvContent } = require('../src/audit-export.ts');
const { sumScoreCounts } = require('../src/score-validation.ts');

// Export cells are quoted; decode independently of the serializer.
function readCsv(csv) {
  const rows = csv.replace(/^\uFEFF/, '').split('\r\n').map(line => [...line.matchAll(/"((?:[^"]|"")*)"(?=,|$)/g)].map(match => match[1].replaceAll('""', '"')));
  return rows.slice(1).map(row => Object.fromEntries(rows[0].map((key, i) => [key, row[i]])));
}

test('real worker aligns per-pair, per-position, per-season and CSV denominators on dirty input', async () => {
  const a = season(1), b = season(2);
  Object.assign(b.matches[0], { home_score: null, away_score: null, ht_home_score: 1 });
  Object.assign(b.matches[1], { ht_home_score: -1, ht_away_score: -1 });
  Object.assign(b.matches[2], { ht_home_score: 3, ht_away_score: 0 });
  Object.assign(b.matches[3], { ht_home_score: 0, ht_away_score: null });
  Object.assign(b.matches[4], { ht_home_score: null, ht_away_score: null });
  Object.assign(b.matches[5], { home_score: -1, away_score: -1 });
  const result = await runWorker(archive([a, b]));
  assert.equal(result.type, 'complete');
  const report = result.report;
  assert.equal(report.reportSchemaVersion, 3);
  assert.equal(report.scoreContractVersion, '2.0.0');
  assert.equal(report.ftValid, 478);
  assert.equal(report.ftMissing, 1);
  assert.equal(report.ftInvalid, 1);
  assert.equal(report.htValid, 477);
  assert.equal(report.htMissing, 1);
  assert.equal(report.htInvalid, 2);
  assert.equal(report.htftValid, 475);
  assert.equal(report.htftInconsistent, 1);
  assert.equal(report.secondHalfValid, 474);
  assert.equal(report.skippedRecords, 0);
  assert.ok(report.seasons[1].issues.some(message => message.includes('HT_INVALID')));
  assert.ok(report.seasons[1].issues.some(message => message.includes('HT_EXCEEDS_FT')));
  const first = report.pairs.find(pair => pair.homeTeam === a.matches[0].home_team && pair.awayTeam === a.matches[0].away_team);
  assert.equal(first.matches, 2);
  assert.equal(first.ftValid, 1);
  assert.equal(first.htValid, 2);
  assert.equal(first.htftValid, 1);
  assert.deepEqual(first.ftScores, [{ key: '1-1', count: 1, rate: 1 }]);
  assert.deepEqual(first.htftScores, [{ key: '0-0>1-1', count: 1, rate: 1 }]);
  const position = report.positions.find(p => p.league === 'angol' && p.matchPosition === 1);
  assert.deepEqual(position.ftOutcomes, [{ key: 'D', count: 1, rate: 1 }]);
  assert.equal(position.ftValid, 1);
  assert.equal(position.htValid, 2);
  assert.equal(position.htftValid, 1);
  const csv = readCsv(pairsCsvContent(report));
  for (const pair of report.pairs) {
    const matches = report.matches.filter(m => m.league === pair.league && m.homeTeam === pair.homeTeam && m.awayTeam === pair.awayTeam);
    const analysis = analyzePairMatches(matches);
    assert.equal(pair.ftValid, analysis.validFt);
    assert.equal(pair.htValid, analysis.validHt);
    assert.equal(pair.htftValid, analysis.validHtFt);
    assert.equal(pair.htMissing, analysis.missingHt);
    assert.equal(pair.htInvalid, analysis.invalidHt);
    assert.equal(pair.secondHalfValid, analysis.validSecondHalf);
    assert.deepEqual(pair.ftScores, analysis.ftScores);
    assert.deepEqual(pair.htftScores, analysis.htftScores);
    const row = csv.find(row => row.home_team === pair.homeTeam && row.away_team === pair.awayTeam);
    assert.equal(Number(row.valid_ft_n), pair.ftValid);
    assert.equal(Number(row.valid_ht_n), pair.htValid);
    assert.equal(Number(row.valid_htft_n), pair.htftValid);
    assert.equal(Number(row.missing_ht_n), pair.htMissing);
    assert.equal(Number(row.invalid_ht_n), pair.htInvalid);
    assert.deepEqual(JSON.parse(row.ft_exact_scores_json), pair.ftScores);
    assert.deepEqual(JSON.parse(row.htft_exact_scores_json), pair.htftScores);
  }
  const matchCsv = readCsv(matchesCsvContent(report));
  const invalid = matchCsv.find(row => row.season_index === '2' && row.match_position === '2');
  assert.equal(invalid.ht_status, 'invalid');
  assert.equal(invalid.ht_outcome, 'HT érvénytelen');
});

test('league-scoped score totals do not include another league', async () => {
  const result = await runWorker(archive([season(1, 'angol'), season(1, 'spanyol'), season(2, 'spanyol')]));
  assert.equal(result.type, 'complete');
  const counts = league => sumScoreCounts(result.report.seasons.filter(s => s.league === league));
  assert.equal(counts('angol').ftValid, 240);
  assert.equal(counts('spanyol').ftValid, 480);
  assert.equal(result.report.ftValid, 720);
});

test('null source rows are reported and excluded rather than crashing the whole worker', async () => {
  const input = season(); input.matches[0] = null;
  const result = await runWorker(archive([input]));
  assert.equal(result.type, 'complete');
  assert.equal(result.report.matchCount, 239);
  assert.equal(result.report.sourceRecordCount, 240);
  assert.equal(result.report.matches.length, 239);
  assert.equal(result.report.skippedRecords, 1);
  assert.equal(result.report.ftValid, 239);
  assert.ok(result.report.seasons[0].issues.some(message => message.includes('INVALID_RECORD')));
});

for (const phase of ['manifest', 'season']) {
  test(`cancellation aborts a pending ${phase} request and never emits a complete report`, async () => {
    const input = archive([season()]);
    input.hangUrl = phase === 'manifest' ? '/archive-manifest.json' : input.manifest.files[0].url;
    const result = await runWorker(input, (message, worker, runId) => {
      if (message.kind === 'request' && message.url === input.hangUrl) worker.postMessage({ type: 'cancel', runId });
    });
    assert.equal(result.type, 'cancelled');
    assert.equal(result.runId, 1);
    assert.ok(result.messages.some(message => message.kind === 'aborted' && message.url === input.hangUrl));
    assert.ok(!result.messages.some(message => message.kind === 'event' && message.event.type === 'complete'));
  });
}

test('a mismatched Git blob hash fails the run without publishing partial results', async () => {
  const input = archive([season()]);
  input.manifest.files[0].sha = '0'.repeat(40);
  const result = await runWorker(input);
  assert.equal(result.type, 'error');
  assert.match(result.message, /SHA-1 eltérés/);
  assert.equal(result.filePath, input.manifest.files[0].path);
  assert.ok(!result.messages.some(message => message.kind === 'event' && message.event.type === 'complete'));
});
