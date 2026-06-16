export type PlayerRole = "hitter" | "pitcher" | "two-way";
export type ComparisonMode = "season" | "career";
export type MetricCategory = "standard" | "rate" | "advanced" | "context";
export type MetricFormat = "integer" | "decimal" | "percentage" | "era" | "innings";
export type BetterDirection = "higher" | "lower" | "neutral";
export type SituationScope = "overall" | "situation";

export type MetricDefinition = {
  id: string;
  label: string;
  category: MetricCategory;
  roleScope: PlayerRole | "both";
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  format: MetricFormat;
  betterDirection: BetterDirection;
};

export type Player = {
  id: string;
  slug: string;
  fullName: string;
  primaryRole: PlayerRole;
  bats: string;
  throws: string;
  teams: string[];
  debutYear: number;
  lastYear: number;
  hallOfFame?: boolean;
  aliases: string[];
  bio: string;
};

export type PlayerSeason = {
  id: string;
  playerId: string;
  season: number;
  team: string;
  role: "hitter" | "pitcher";
  stats: Record<string, number>;
  sourceMap: Record<string, string>;
};

export type SituationFilter = {
  inningMin?: number;
  inningMax?: number;
  maxRunMargin?: number;
};

export type SituationSplit = {
  id: string;
  playerId: string;
  season: number;
  role: "hitter" | "pitcher";
  label: string;
  filter: SituationFilter;
  sampleSizeLabel: string;
  stats: Record<string, number>;
  sourceMap: Record<string, string>;
};

export type ImportedDataset = {
  source: "stathead-batting";
  importedAt: string;
  rowCount: number;
  players: Player[];
  seasons: PlayerSeason[];
};

export type ImportedSituationDataset = {
  source: "stathead-batting-splits";
  importedAt: string;
  rowCount: number;
  players: Player[];
  splits: SituationSplit[];
};

export type CareerAggregate = {
  playerId: string;
  role: "hitter" | "pitcher";
  stats: Record<string, number>;
  peakWindow: {
    label: string;
    years: number[];
    stats: Record<string, number>;
  };
};

export type CompareRequest = {
  playerIds: string[];
  mode: ComparisonMode;
  metrics?: string[];
  startYear?: number;
  endYear?: number;
  role?: "hitter" | "pitcher";
  situation?: SituationFilter;
};

export type CompareSeriesPoint = {
  season: number;
  value: number | null;
};

export type CompareResponse = {
  mode: ComparisonMode;
  role: "hitter" | "pitcher";
  scope: SituationScope;
  situationLabel?: string;
  metrics: MetricDefinition[];
  players: Array<{
    player: Player;
    rows: Array<{
      label: string;
      season?: number;
      stats: Record<string, number | null>;
    }>;
    summary: CareerAggregate;
    series: Record<string, CompareSeriesPoint[]>;
  }>;
};
