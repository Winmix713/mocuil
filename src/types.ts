export type Team = {
  id: string;
  name: string;
  short: string;
  city: string;
  league: string;
  form: number[];
  xg: number;
  strength: number;
  color1: string;
  color2: string;
};

export type MatchSlot = {
  id: number;
  home: Team | null;
  away: Team | null;
};

export type Signal = {
  label: string;
  confidence: number;
  type: 'primary' | 'secondary' | 'tertiary';
};

export type MatchPrediction = {
  slotId: number;
  home: Team;
  away: Team;
  confidence: number;
  prediction: string;
  predictedScore: string;
  signals: Signal[];
  heatGrid: number[];
};

export type Page = 'landing' | 'dashboard' | 'insights' | 'brand';
