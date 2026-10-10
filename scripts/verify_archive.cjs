require('../tests/helpers/register-ts.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { runWorker } = require('../tests/helpers/worker.cjs');
const { analyzePairMatches } = require('../src/pair-analysis.ts');
const reference = require('../tests/fixtures/archive-reference.json');

async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(__dirname, '../public/archive-manifest.json'), 'utf8'));
  assert.equal(manifest.commitSha, reference.sourceCommit, 'Reference belongs to a different archive commit; review the snapshot explicitly.');
  for (const file of manifest.files) assert.equal(file.url, `https://raw.githubusercontent.com/Winmix713/tertpea/${reference.sourceCommit}/${file.path}`, `Unpinned URL: ${file.path}`);
  const cache = path.resolve(process.env.WINMIX_ARCHIVE_CACHE || path.join(__dirname, '../.cache/winmix-archive'));
  await fs.mkdir(cache, { recursive: true });
  let next = 0, downloaded = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < manifest.files.length) {
      const file = manifest.files[next++];
      const target = path.join(cache, file.sha + '.json');
      try { await fs.access(target); continue; } catch { /* Fetch the exact pinned blob. */ }
      const response = await fetch(file.url, { signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${file.path}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(target + '.tmp', bytes);
      await fs.rename(target + '.tmp', target);
      downloaded += 1;
      if (downloaded % 20 === 0) console.log(`Downloaded ${downloaded} archive files`);
    }
  }));
  const result = await runWorker({ manifest, archiveCache: cache }, undefined, { timeoutMs: 120000 });
  assert.equal(result.type, 'complete', JSON.stringify(result.type === 'error' ? result : { type: result.type }));
  const report = result.report;
  for (const key of ['sourceFileCount', 'sourceBytes', 'matchCount', 'ftValid', 'htValid', 'htMissing', 'htftValid', 'secondHalfValid']) assert.equal(report[key], reference[key], key);
  for (const key of ['ftMissing', 'ftInvalid', 'htInvalid', 'htftInconsistent', 'skippedRecords', 'checksumFailures', 'issueCount']) assert.equal(report[key], 0, key);
  assert.equal(report.pairs.length, reference.pairCount);
  assert.equal(report.roundBlocksValid, true);
  assert.equal(report.pairSetsIdentical, true);
  for (const [league, expected] of Object.entries(reference.leagues)) {
    for (const [key, value] of Object.entries(expected)) assert.equal(report.leagues[league][key], value, `${league}.${key}`);
  }
  const grouped = new Map();
  for (const match of report.matches) {
    const key = JSON.stringify([match.league, match.homeTeam, match.awayTeam]);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(match);
  }
  for (const pair of report.pairs) {
    const analysis = analyzePairMatches(grouped.get(JSON.stringify([pair.league, pair.homeTeam, pair.awayTeam])));
    assert.equal(pair.ftValid, analysis.validFt);
    assert.equal(pair.htValid, analysis.validHt);
    assert.equal(pair.htftValid, analysis.validHtFt);
    assert.equal(pair.secondHalfValid, analysis.validSecondHalf);
    assert.deepEqual(pair.ftScores, analysis.ftScores);
    assert.deepEqual(pair.htftScores, analysis.htftScores);
    assert.deepEqual(pair.htftOutcomes, analysis.htftOutcomes);
  }
  console.log(`PASS ${reference.sourceCommit}: ${report.sourceFileCount} verified files, ${report.matchCount} matches, HT ${report.htValid}, missing HT ${report.htMissing}, ${report.pairs.length} matching pair summaries.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
