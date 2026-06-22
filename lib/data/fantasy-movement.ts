export type MovementType = "player" | "coach";

export type PlayerMovement = {
  type: "player";
  name: string;
  position: "QB" | "RB" | "WR" | "TE" | "FB";
  fromTeam: string;
  toTeam: string;
  moveType: "Free agency" | "Trade";
  fantasyNote: string;
};

export type CoachMovement = {
  type: "coach";
  name: string;
  role: "Head coach";
  fromTeam: string;
  toTeam: string;
  replaced: string;
  fantasyNote: string;
};

export type MovementRow = PlayerMovement | CoachMovement;

export const movementSource =
  "2026 NFL offseason notable player movement and head coaching changes, compiled from the 2026 NFL season movement tracker.";

export const movementRows: MovementRow[] = [
  { type: "player", name: "Kirk Cousins", position: "QB", fromTeam: "ATL", toTeam: "LV", moveType: "Free agency", fantasyNote: "Veteran QB change creates a new passing-game baseline for Raiders skill players." },
  { type: "player", name: "Gardner Minshew", position: "QB", fromTeam: "KC", toTeam: "ARI", moveType: "Free agency", fantasyNote: "Depth QB move with possible spot-start relevance." },
  { type: "player", name: "Kyler Murray", position: "QB", fromTeam: "ARI", toTeam: "MIN", moveType: "Free agency", fantasyNote: "Major rushing QB move; boosts volatility and ceiling for Minnesota stacks." },
  { type: "player", name: "Tua Tagovailoa", position: "QB", fromTeam: "MIA", toTeam: "ATL", moveType: "Free agency", fantasyNote: "Accuracy-driven passer changes the Atlanta receiving projection." },
  { type: "player", name: "Malik Willis", position: "QB", fromTeam: "GB", toTeam: "MIA", moveType: "Free agency", fantasyNote: "Mobile QB depth with contingency upside." },
  { type: "player", name: "Geno Smith", position: "QB", fromTeam: "LV", toTeam: "NYJ", moveType: "Trade", fantasyNote: "Likely starter-level move that changes Jets pass volume assumptions." },
  { type: "player", name: "Andy Dalton", position: "QB", fromTeam: "CAR", toTeam: "PHI", moveType: "Trade", fantasyNote: "Veteran backup move with low direct draft impact." },
  { type: "player", name: "Rico Dowdle", position: "RB", fromTeam: "CAR", toTeam: "PIT", moveType: "Free agency", fantasyNote: "Potential early-down role shift in a physical rushing environment." },
  { type: "player", name: "Travis Etienne", position: "RB", fromTeam: "JAX", toTeam: "NO", moveType: "Free agency", fantasyNote: "Feature-back talent moving into a new backfield usage tree." },
  { type: "player", name: "Kenneth Gainwell", position: "RB", fromTeam: "PIT", toTeam: "TB", moveType: "Free agency", fantasyNote: "Passing-down skill set matters most in PPR formats." },
  { type: "player", name: "Isiah Pacheco", position: "RB", fromTeam: "KC", toTeam: "DET", moveType: "Free agency", fantasyNote: "Explosive runner joining a high-efficiency offensive environment." },
  { type: "player", name: "Patrick Ricard", position: "FB", fromTeam: "BAL", toTeam: "NYG", moveType: "Free agency", fantasyNote: "More important for run-blocking context than direct fantasy drafting." },
  { type: "player", name: "Kenneth Walker III", position: "RB", fromTeam: "SEA", toTeam: "KC", moveType: "Free agency", fantasyNote: "High-leverage landing spot with touchdown and efficiency upside." },
  { type: "player", name: "Rachaad White", position: "RB", fromTeam: "TB", toTeam: "WAS", moveType: "Free agency", fantasyNote: "Receiving profile keeps PPR floor in focus." },
  { type: "player", name: "David Montgomery", position: "RB", fromTeam: "DET", toTeam: "HOU", moveType: "Trade", fantasyNote: "Goal-line role potential changes Houston touchdown projections." },
  { type: "player", name: "Romeo Doubs", position: "WR", fromTeam: "GB", toTeam: "NE", moveType: "Free agency", fantasyNote: "Could command meaningful perimeter targets in a thinner receiver room." },
  { type: "player", name: "Mike Evans", position: "WR", fromTeam: "TB", toTeam: "SF", moveType: "Free agency", fantasyNote: "Touchdown profile meets a high-efficiency passing offense." },
  { type: "player", name: "Jauan Jennings", position: "WR", fromTeam: "SF", toTeam: "MIN", moveType: "Free agency", fantasyNote: "Role depends on target competition, but route stability is useful." },
  { type: "player", name: "Darnell Mooney", position: "WR", fromTeam: "ATL", toTeam: "NYG", moveType: "Free agency", fantasyNote: "Field-stretching role changes Giants target distribution." },
  { type: "player", name: "Kalif Raymond", position: "WR", fromTeam: "DET", toTeam: "CHI", moveType: "Free agency", fantasyNote: "Depth and return value more than core fantasy value." },
  { type: "player", name: "Wan'Dale Robinson", position: "WR", fromTeam: "NYG", toTeam: "TEN", moveType: "Free agency", fantasyNote: "Short-area target profile can matter in full PPR." },
  { type: "player", name: "D. J. Moore", position: "WR", fromTeam: "CHI", toTeam: "BUF", moveType: "Trade", fantasyNote: "Major target-earner joining a premium quarterback ecosystem." },
  { type: "player", name: "Jaylen Waddle", position: "WR", fromTeam: "MIA", toTeam: "DEN", moveType: "Trade", fantasyNote: "Explosive receiver move should reshape Denver air-yard expectations." },
  { type: "player", name: "A. J. Brown", position: "WR", fromTeam: "PHI", toTeam: "NE", moveType: "Trade", fantasyNote: "Alpha receiver move creates a major New England projection swing." },
  { type: "player", name: "Isaiah Likely", position: "TE", fromTeam: "BAL", toTeam: "NYG", moveType: "Free agency", fantasyNote: "Athletic TE with route expansion opportunity." },
  { type: "player", name: "David Njoku", position: "TE", fromTeam: "CLE", toTeam: "LAC", moveType: "Free agency", fantasyNote: "YAC-heavy TE landing with a strong quarterback fit." },
  { type: "coach", name: "Mike LaFleur", role: "Head coach", fromTeam: "LAR", toTeam: "ARI", replaced: "Jonathan Gannon", fantasyNote: "Offensive background could reshape Arizona pace and pass concepts." },
  { type: "coach", name: "Kevin Stefanski", role: "Head coach", fromTeam: "CLE", toTeam: "ATL", replaced: "Raheem Morris", fantasyNote: "Play-action and structure may help Atlanta skill-player efficiency." },
  { type: "coach", name: "Jesse Minter", role: "Head coach", fromTeam: "LAC", toTeam: "BAL", replaced: "John Harbaugh", fantasyNote: "Defensive hire; offensive continuity questions matter for Ravens projections." },
  { type: "coach", name: "Joe Brady", role: "Head coach", fromTeam: "BUF OC", toTeam: "BUF", replaced: "Sean McDermott", fantasyNote: "Promotion keeps offensive familiarity for Buffalo fantasy pieces." },
  { type: "coach", name: "Todd Monken", role: "Head coach", fromTeam: "BAL OC", toTeam: "CLE", replaced: "Kevin Stefanski", fantasyNote: "Aggressive passing/play-action profile could affect Browns target volume." },
  { type: "coach", name: "Klint Kubiak", role: "Head coach", fromTeam: "SEA OC", toTeam: "LV", replaced: "Pete Carroll", fantasyNote: "New offensive identity for Raiders backs and receivers." },
  { type: "coach", name: "Jeff Hafley", role: "Head coach", fromTeam: "GB DC", toTeam: "MIA", replaced: "Mike McDaniel", fantasyNote: "Defensive hire creates uncertainty around Miami's previous offensive identity." },
  { type: "coach", name: "John Harbaugh", role: "Head coach", fromTeam: "BAL", toTeam: "NYG", replaced: "Brian Daboll / Mike Kafka", fantasyNote: "Stabilizing veteran coach changes Giants team context." },
  { type: "coach", name: "Robert Saleh", role: "Head coach", fromTeam: "SF DC", toTeam: "TEN", replaced: "Brian Callahan / Mike McCoy", fantasyNote: "Defensive hire; offensive coordinator fit will matter for Titans fantasy values." },
  { type: "coach", name: "Mike McCarthy", role: "Head coach", fromTeam: "Former DAL", toTeam: "PIT", replaced: "Mike Tomlin", fantasyNote: "Veteran offensive coach changes Pittsburgh pass-rate assumptions." }
];
