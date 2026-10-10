require('./helpers/register-ts.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzePairMatches } = require('../src/pair-analysis.ts');
const { assessPeriodScore, assessMatchScores, emptyScoreCounts, countScoreSample, sumScoreCounts } = require('../src/score-validation.ts');
const { readErrorDetails } = require('../src/error-details.ts');
const { match } = require('./helpers/fixtures.cjs');

test('valid HT is counted independently of absent FT', () => {
  const result = analyzePairMatches([match({ ftHome: null, ftAway: null, ftStatus: 'missing', htHome: 1, htAway: 0 })]);
  assert.equal(result.validFt, 0);
  assert.equal(result.missingFt, 1);
  assert.equal(result.validHt, 1);
  assert.deepEqual(result.htScores, [{ key: '1-0', count: 1, rate: 1 }]);
  assert.equal(result.averages.htTotal, 1);
  assert.equal(result.validHtFt, 0);
  assert.equal(result.validSecondHalf, 0);
});

test('HT→FT uses the joint sample, not the independent HT denominator', () => {
  const result = analyzePairMatches([match(), match({ ftHome: null, ftAway: null, ftStatus: 'missing', htHome: 1 })]);
  assert.equal(result.validHt, 2);
  assert.equal(result.validHtFt, 1);
  assert.deepEqual(result.htftScores, [{ key: '0-0>1-1', count: 1, rate: 1 }]);
});

test('zero-zero is a valid observation for both periods', () => {
  const result = analyzePairMatches([match({ ftHome: 0, ftAway: 0 })]);
  assert.equal(result.validFt, 1);
  assert.equal(result.validSecondHalf, 1);
  assert.deepEqual(result.ftBtts, [{ key: 'Nem', count: 1, rate: 1 }]);
  assert.equal(result.ftGoalLines.find(row => row.line === '0,5').underRate, 1);
  assert.deepEqual(result.halfWithMoreGoals, [{ key: 'Ugyanannyi', count: 1, rate: 1 }]);
});

test('missing, partial and invalid values are different states', () => {
  assert.equal(assessPeriodScore(null, null).status, 'missing');
  assert.equal(assessPeriodScore(undefined, undefined).status, 'missing');
  for (const [home, away] of [[null, 0], [-1, -1], ['0', '0'], [0.5, 1], [NaN, 1], [Infinity, 1], [Number.MAX_SAFE_INTEGER + 1, 0]]) {
    assert.equal(assessPeriodScore(home, away).status, 'invalid');
  }
  const normalizedInvalid = analyzePairMatches([match({ htHome: null, htAway: null, htStatus: 'invalid' })]);
  assert.equal(normalizedInvalid.invalidHt, 1);
  assert.equal(normalizedInvalid.missingHt, 0);
  assert.equal(normalizedInvalid.validFt, 1);
});

test('inconsistent observations stay in FT/HT and observed transitions, not second-half metrics', () => {
  const result = analyzePairMatches([match({ htHome: 3, htAway: 0 })]);
  assert.equal(result.inconsistentHtFt, 1);
  assert.equal(result.validFt, 1);
  assert.equal(result.validHt, 1);
  assert.equal(result.validHtFt, 1);
  assert.equal(result.htftScores[0].key, '3-0>1-1');
  assert.equal(result.validSecondHalf, 0);
  assert.deepEqual(result.secondHalfGoalLines, []);
  assert.equal(result.averages.secondHalfTotal, null);
});

test('half comparison uses totals rather than the full-time winner', () => {
  const result = analyzePairMatches([match({ ftHome: 2, ftAway: 1, htHome: 1, htAway: 0 })]);
  assert.deepEqual(result.secondHalfOutcomes, [{ key: 'D', count: 1, rate: 1 }]);
  assert.deepEqual(result.halfWithMoreGoals, [{ key: '2. félidőben több', count: 1, rate: 1 }]);
});

test('empty samples have no fabricated zero-percent distributions', () => {
  const result = analyzePairMatches([]);
  for (const key of ['ftGoalLines', 'htGoalLines', 'secondHalfGoalLines', 'ftScores', 'htScores', 'htftScores']) assert.deepEqual(result[key], []);
  assert.equal(result.averages.ftTotal, null);
});

test('scoped counters sum only the selected records', () => {
  const angol = emptyScoreCounts(), spanyol = emptyScoreCounts();
  countScoreSample(angol, assessMatchScores(match()));
  countScoreSample(spanyol, assessMatchScores(match({ ftStatus: 'missing', ftHome: null, ftAway: null })));
  assert.equal(sumScoreCounts([angol]).ftValid, 1);
  assert.equal(sumScoreCounts([spanyol]).ftValid, 0);
  assert.equal(sumScoreCounts([angol, spanyol]).htValid, 2);
});

test('structured Supabase diagnostics retain message, code, details and hint', () => {
  const original = { code: 'PGRST205', message: 'Table not found', details: 'public.winmix_data_versions', hint: 'Check table name' };
  assert.deepEqual(readErrorDetails(original, 'fallback'), original);
  assert.equal(readErrorDetails(new Error('Network failed'), 'fallback').message, 'Network failed');
  assert.equal(readErrorDetails(null, 'fallback').message, 'fallback');
});
