const { createHash } = require('node:crypto');

function season(seasonIndex = 1, league = 'angol') {
  const ring = Array.from({ length: 16 }, (_, i) => `T${String(i + 1).padStart(2, '0')}`);
  const firstLeg = [];
  for (let round = 0; round < 15; round++) {
    firstLeg.push(Array.from({ length: 8 }, (_, i) => [ring[i], ring[15 - i]]));
    ring.splice(1, 0, ring.pop());
  }
  const rounds = [...firstLeg, ...firstLeg.map(pairs => pairs.map(([h, a]) => [a, h]))];
  return {
    id: `${league}-${seasonIndex}`, league, seasonIndex, name: `${league} ${seasonIndex}`, actualMatchCount: 240,
    matches: rounds.flatMap((pairs, round) => pairs.map(([home_team, away_team], slot) => ({
      match_no: round * 8 + slot + 1, date: `${String(6 + Math.floor(round / 20)).padStart(2, '0')}:${String(round * 3 % 60).padStart(2, '0')}`,
      home_team, away_team, home_score: 1, away_score: 1, ht_home_score: 0, ht_away_score: 0,
    }))),
  };
}

function archive(seasons) {
  const bodies = {};
  const files = seasons.map(s => {
    const filePath = `${s.league}/${s.seasonIndex}.json`;
    const body = JSON.stringify(s);
    bodies[filePath] = body;
    const bytes = Buffer.from(body);
    return {
      path: filePath, url: `https://fixture.invalid/${filePath}`, league: s.league, seasonIndex: s.seasonIndex, seasonName: s.name,
      size: bytes.length, sha: createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),
    };
  });
  return { manifest: { source: 'fixture', commitSha: 'test-commit', treeSha: 'test-tree', exportedAt: '2026-09-15T00:00:00Z', schemaVersion: 3, seasonCount: files.length, expectedByteCount: files.reduce((sum, f) => sum + f.size, 0), files }, bodies };
}

function match(overrides = {}) {
  return { league: 'angol', seasonIndex: 1, seasonName: 'Test season', seasonKey: 'test', matchPosition: 1, roundNo: 1, matchInRound: 1, virtualTime: '06:00', homeTeam: 'Home', awayTeam: 'Away', ftHome: 1, ftAway: 1, htHome: 0, htAway: 0, ftOutcome: 'D', htOutcome: 'D', ftStatus: 'valid', htStatus: 'valid', periodConsistency: 'consistent', ...overrides };
}
module.exports = { season, archive, match };
