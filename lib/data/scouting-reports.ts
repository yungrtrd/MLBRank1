export type PlayerRole = "Position Player" | "Starting Pitcher" | "Reliever" | "Catcher";

export type ToolGrade = {
  label: string;
  grade: number;
  note: string;
};

export type DataPoint = {
  label: string;
  value: number;
  detail: string;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type StatItem = {
  label: string;
  value: string;
  note?: string;
};

export type StatGroup = {
  title: string;
  source: string;
  stats: StatItem[];
};

export type StatHistoryRow = {
  season: string;
  team: string;
  level: string;
  stats: StatItem[];
};

export type StatSplitKey = "all" | "home" | "away" | "day" | "night";

export type StatTrendSplit = {
  key: StatSplitKey;
  label: string;
  seasons: StatHistoryRow[];
  months: StatHistoryRow[];
};

export type StatHistory = {
  type: "hitter" | "pitcher";
  source: string;
  seasons: StatHistoryRow[];
  months?: StatHistoryRow[];
  splitSeries?: StatTrendSplit[];
  career: StatItem[];
};

export type SourceLink = {
  label: string;
  url: string;
};

export type ReportStatus = "active-mlb" | "minor-league" | "free-agent";

export type PlayerEvaluation = {
  id: string;
  mlbPlayerId?: number;
  teamId: string;
  reportStatus?: ReportStatus;
  statusNote?: string;
  birthPlace?: string;
  preProPath?: string;
  playerRating?: string;
  playerName: string;
  position: string;
  role: PlayerRole;
  age: number;
  batsThrows: string;
  reportDate: string;
  summary: string;
  evaluation: string;
  strengths: string[];
  questions: string[];
  recommendation: string;
  overallFutureValue: number;
  risk: "Low" | "Medium" | "High";
  tools: ToolGrade[];
  statGroups: StatGroup[];
  statHistory: StatHistory;
  dataPoints: DataPoint[];
  trend: TrendPoint[];
  sourceLinks: SourceLink[];
  tags: string[];
};

export type Team = {
  id: string;
  name: string;
  league: "AL" | "NL";
  division: "East" | "Central" | "West";
  abbreviation: string;
  color: string;
};

export const teams: Team[] = [
  { id: "orioles", name: "Baltimore Orioles", league: "AL", division: "East", abbreviation: "BAL", color: "#df4601" },
  { id: "red-sox", name: "Boston Red Sox", league: "AL", division: "East", abbreviation: "BOS", color: "#bd3039" },
  { id: "yankees", name: "New York Yankees", league: "AL", division: "East", abbreviation: "NYY", color: "#0c2340" },
  { id: "rays", name: "Tampa Bay Rays", league: "AL", division: "East", abbreviation: "TB", color: "#8fbce6" },
  { id: "blue-jays", name: "Toronto Blue Jays", league: "AL", division: "East", abbreviation: "TOR", color: "#134a8e" },
  { id: "white-sox", name: "Chicago White Sox", league: "AL", division: "Central", abbreviation: "CWS", color: "#27251f" },
  { id: "guardians", name: "Cleveland Guardians", league: "AL", division: "Central", abbreviation: "CLE", color: "#e31937" },
  { id: "tigers", name: "Detroit Tigers", league: "AL", division: "Central", abbreviation: "DET", color: "#fa4616" },
  { id: "royals", name: "Kansas City Royals", league: "AL", division: "Central", abbreviation: "KC", color: "#004687" },
  { id: "twins", name: "Minnesota Twins", league: "AL", division: "Central", abbreviation: "MIN", color: "#002b5c" },
  { id: "astros", name: "Houston Astros", league: "AL", division: "West", abbreviation: "HOU", color: "#eb6e1f" },
  { id: "angels", name: "Los Angeles Angels", league: "AL", division: "West", abbreviation: "LAA", color: "#ba0021" },
  { id: "athletics", name: "Athletics", league: "AL", division: "West", abbreviation: "ATH", color: "#003831" },
  { id: "mariners", name: "Seattle Mariners", league: "AL", division: "West", abbreviation: "SEA", color: "#005c5c" },
  { id: "rangers", name: "Texas Rangers", league: "AL", division: "West", abbreviation: "TEX", color: "#003278" },
  { id: "braves", name: "Atlanta Braves", league: "NL", division: "East", abbreviation: "ATL", color: "#ce1141" },
  { id: "marlins", name: "Miami Marlins", league: "NL", division: "East", abbreviation: "MIA", color: "#00a3e0" },
  { id: "mets", name: "New York Mets", league: "NL", division: "East", abbreviation: "NYM", color: "#ff5910" },
  { id: "phillies", name: "Philadelphia Phillies", league: "NL", division: "East", abbreviation: "PHI", color: "#e81828" },
  { id: "nationals", name: "Washington Nationals", league: "NL", division: "East", abbreviation: "WSH", color: "#ab0003" },
  { id: "cubs", name: "Chicago Cubs", league: "NL", division: "Central", abbreviation: "CHC", color: "#0e3386" },
  { id: "reds", name: "Cincinnati Reds", league: "NL", division: "Central", abbreviation: "CIN", color: "#c6011f" },
  { id: "brewers", name: "Milwaukee Brewers", league: "NL", division: "Central", abbreviation: "MIL", color: "#ffc52f" },
  { id: "pirates", name: "Pittsburgh Pirates", league: "NL", division: "Central", abbreviation: "PIT", color: "#fdb827" },
  { id: "cardinals", name: "St. Louis Cardinals", league: "NL", division: "Central", abbreviation: "STL", color: "#c41e3a" },
  { id: "diamondbacks", name: "Arizona Diamondbacks", league: "NL", division: "West", abbreviation: "ARI", color: "#a71930" },
  { id: "rockies", name: "Colorado Rockies", league: "NL", division: "West", abbreviation: "COL", color: "#33006f" },
  { id: "dodgers", name: "Los Angeles Dodgers", league: "NL", division: "West", abbreviation: "LAD", color: "#005a9c" },
  { id: "padres", name: "San Diego Padres", league: "NL", division: "West", abbreviation: "SD", color: "#2f241d" },
  { id: "giants", name: "San Francisco Giants", league: "NL", division: "West", abbreviation: "SF", color: "#fd5a1e" }
];

export const evaluations: PlayerEvaluation[] = [];
