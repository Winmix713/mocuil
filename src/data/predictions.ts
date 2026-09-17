import type { Team, MatchPrediction, Signal } from '@/types';

export const TEAMS: Team[] = [
  { id: 'ars', name: 'Arsenal', short: 'ARS', city: 'London', league: 'Premier League', form: [4, 3, 5, 4, 3], xg: 1.82, strength: 0.89, color1: '#ef0107', color2: '#063672' },
  { id: 'mci', name: 'Manchester City', short: 'MCI', city: 'Manchester', league: 'Premier League', form: [5, 5, 4, 5, 4], xg: 2.14, strength: 0.93, color1: '#6cabdd', color2: '#1c2c5b' },
  { id: 'liv', name: 'Liverpool', short: 'LIV', city: 'Liverpool', league: 'Premier League', form: [5, 4, 4, 3, 5], xg: 1.95, strength: 0.91, color1: '#c8102e', color2: '#00b2a9' },
  { id: 'che', name: 'Chelsea', short: 'CHE', city: 'London', league: 'Premier League', form: [3, 4, 3, 5, 2], xg: 1.67, strength: 0.84, color1: '#034694', color2: '#dba111' },
  { id: 'tot', name: 'Tottenham', short: 'TOT', city: 'London', league: 'Premier League', form: [4, 2, 5, 4, 3], xg: 1.74, strength: 0.82, color1: '#132257', color2: '#ffffff' },
  { id: 'mun', name: 'Manchester United', short: 'MUN', city: 'Manchester', league: 'Premier League', form: [3, 3, 4, 2, 4], xg: 1.51, strength: 0.79, color1: '#da291c', color2: '#fbe122' },
  { id: 'new', name: 'Newcastle', short: 'NEW', city: 'Newcastle', league: 'Premier League', form: [4, 5, 3, 4, 4], xg: 1.68, strength: 0.81, color1: '#241f20', color2: '#ffffff' },
  { id: 'avl', name: 'Aston Villa', short: 'AVL', city: 'Birmingham', league: 'Premier League', form: [3, 5, 4, 3, 3], xg: 1.59, strength: 0.78, color1: '#95bfe5', color2: '#670e36' },
  { id: 'bar', name: 'Barcelona', short: 'BAR', city: 'Barcelona', league: 'La Liga', form: [5, 4, 5, 4, 5], xg: 2.08, strength: 0.92, color1: '#a50044', color2: '#004d98' },
  { id: 'rma', name: 'Real Madrid', short: 'RMA', city: 'Madrid', league: 'La Liga', form: [5, 5, 5, 4, 5], xg: 2.21, strength: 0.95, color1: '#febe10', color2: '#00529f' },
  { id: 'atm', name: 'Atletico Madrid', short: 'ATM', city: 'Madrid', league: 'La Liga', form: [4, 3, 4, 5, 3], xg: 1.63, strength: 0.85, color1: '#cb3524', color2: '#262e62' },
  { id: 'sev', name: 'Sevilla', short: 'SEV', city: 'Sevilla', league: 'La Liga', form: [3, 4, 2, 3, 4], xg: 1.42, strength: 0.74, color1: '#d81920', color2: '#ffffff' },
  { id: 'bay', name: 'Bayern Munich', short: 'BAY', city: 'Munich', league: 'Bundesliga', form: [5, 5, 4, 5, 5], xg: 2.35, strength: 0.94, color1: '#dc052d', color2: '#0066b2' },
  { id: 'bvb', name: 'Borussia Dortmund', short: 'BVB', city: 'Dortmund', league: 'Bundesliga', form: [4, 4, 5, 3, 4], xg: 1.81, strength: 0.86, color1: '#fde100', color2: '#000000' },
  { id: 'rbl', name: 'RB Leipzig', short: 'RBL', city: 'Leipzig', league: 'Bundesliga', form: [4, 5, 4, 4, 3], xg: 1.72, strength: 0.83, color1: '#dd0741', color2: '#001f47' },
  { id: 'lev', name: 'Bayer Leverkusen', short: 'LEV', city: 'Leverkusen', league: 'Bundesliga', form: [5, 4, 5, 5, 4], xg: 1.98, strength: 0.88, color1: '#e32221', color2: '#000000' },
  { id: 'juv', name: 'Juventus', short: 'JUV', city: 'Turin', league: 'Serie A', form: [4, 3, 4, 4, 3], xg: 1.55, strength: 0.83, color1: '#000000', color2: '#ffffff' },
  { id: 'int', name: 'Inter Milan', short: 'INT', city: 'Milan', league: 'Serie A', form: [5, 4, 4, 5, 4], xg: 1.86, strength: 0.87, color1: '#0068a8', color2: '#000000' },
  { id: 'mil', name: 'AC Milan', short: 'MIL', city: 'Milan', league: 'Serie A', form: [4, 4, 3, 4, 5], xg: 1.71, strength: 0.84, color1: '#fb090b', color2: '#000000' },
  { id: 'nap', name: 'Napoli', short: 'NAP', city: 'Naples', league: 'Serie A', form: [5, 4, 5, 3, 4], xg: 1.79, strength: 0.85, color1: '#0099e0', color2: '#000000' },
  { id: 'psg', name: 'Paris Saint-Germain', short: 'PSG', city: 'Paris', league: 'Ligue 1', form: [5, 5, 4, 5, 4], xg: 2.12, strength: 0.90, color1: '#004170', color2: '#da294c' },
  { id: 'om', name: 'Marseille', short: 'OM', city: 'Marseille', league: 'Ligue 1', form: [4, 3, 4, 3, 4], xg: 1.54, strength: 0.78, color1: '#2faee0', color2: '#ffffff' },
  { id: 'lyo', name: 'Lyon', short: 'LYO', city: 'Lyon', league: 'Ligue 1', form: [3, 4, 3, 4, 3], xg: 1.48, strength: 0.76, color1: '#001e62', color2: '#e2001a' },
  { id: 'ben', name: 'Benfica', short: 'BEN', city: 'Lisbon', league: 'Primeira Liga', form: [5, 4, 4, 5, 3], xg: 1.76, strength: 0.83, color1: '#e40521', color2: '#ffffff' },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateHeatGrid(rng: () => number): number[] {
  const grid: number[] = [];
  for (let i = 0; i < 40; i++) {
    grid.push(rng());
  }
  return grid;
}

function generateSignals(home: Team, away: Team, rng: () => number): Signal[] {
  const signals: Signal[] = [];
  const homeFormAvg = home.form.reduce((a, b) => a + b, 0) / home.form.length;
  const awayFormAvg = away.form.reduce((a, b) => a + b, 0) / away.form.length;
  const formDiff = Math.abs(homeFormAvg - awayFormAvg);

  if (formDiff > 0.8) {
    signals.push({
      label: `${home.short} streak echo · 5R form`,
      confidence: Math.min(0.99, 0.75 + formDiff * 0.08),
      type: 'primary',
    });
  } else {
    signals.push({
      label: `Tight form corridor · both sides`,
      confidence: 0.72 + rng() * 0.1,
      type: 'secondary',
    });
  }

  const xgDiff = Math.abs(home.xg - away.xg);
  if (xgDiff > 0.3) {
    signals.push({
      label: `xG divergence flag · ${xgDiff > 0 ? home.short : away.short} edge`,
      confidence: Math.min(0.95, 0.68 + xgDiff * 0.1),
      type: 'secondary',
    });
  } else {
    signals.push({
      label: 'xG parity zone · neutral',
      confidence: 0.65 + rng() * 0.08,
      type: 'tertiary',
    });
  }

  const strengthDiff = Math.abs(home.strength - away.strength);
  if (strengthDiff > 0.08) {
    signals.push({
      label: `Strength asymmetry · ${(home.strength > away.strength ? home.short : away.short)} dominant`,
      confidence: Math.min(0.97, 0.7 + strengthDiff),
      type: 'secondary',
    });
  } else {
    signals.push({
      label: 'Derby volatility window',
      confidence: 0.7 + rng() * 0.1,
      type: 'tertiary',
    });
  }

  return signals.sort((a, b) => b.confidence - a.confidence);
}

export function generatePrediction(
  slotId: number,
  home: Team,
  away: Team
): MatchPrediction {
  const seed = (slotId + 1) * 137 + home.id.charCodeAt(0) + away.id.charCodeAt(0);
  const rng = seededRandom(seed);

  const homeAdvantage = 0.05;
  const homeScore = Math.round((home.xg * home.strength + homeAdvantage) * (0.8 + rng() * 0.4));
  const awayScore = Math.round((away.xg * away.strength) * (0.8 + rng() * 0.4));

  const signals = generateSignals(home, away, rng);
  const topSignal = signals[0];
  const confidence = Math.min(0.99, topSignal.confidence + rng() * 0.05);

  let prediction: string;
  if (homeScore > awayScore) {
    prediction = `${home.short} Win`;
  } else if (awayScore > homeScore) {
    prediction = `${away.short} Win`;
  } else {
    prediction = 'Draw';
  }

  return {
    slotId,
    home,
    away,
    confidence: Math.round(confidence * 1000) / 10,
    prediction,
    predictedScore: `${homeScore} - ${awayScore}`,
    signals,
    heatGrid: generateHeatGrid(rng),
  };
}
