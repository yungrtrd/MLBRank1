import { fantasyDraftRows } from "@/lib/data/fantasy-draft";
import { fantasySeasonRows, fantasyWeeklyRows } from "@/lib/data/fantasy-football";
import { movementRows } from "@/lib/data/fantasy-movement";

export type ProjectionPosition = "QB" | "RB" | "WR" | "TE";

export type FantasyProjectionWeek = {
  week: number;
  opponentTier: string;
  projectedPoints: number;
  defenseAdjustment: number;
  basis: string;
};

export type FantasyProjectionRow = {
  rank: number;
  player: string;
  team: string;
  previousTeam: string;
  position: ProjectionPosition;
  projectedPoints: number;
  projectedWeeklyAverage: number;
  points2025: number;
  games2025: number;
  teamAdjustment: number;
  coachAdjustment: number;
  defenseAdjustment: number;
  confidence: number;
  note: string;
  weeks: FantasyProjectionWeek[];
};

type WeeklySample = {
  week: number;
  points: number;
  opponent: string;
  opponentRank: number;
  opponentTier: string;
};

type OffensiveProfile = {
  key: string;
  player: string;
  position: ProjectionPosition;
  pointsPerGame: number;
  opportunityPerGame: number;
  targetsPerGame: number;
  yardsPerGame: number;
  outperformancePerGame: number;
};

const positions: ProjectionPosition[] = ["QB", "RB", "WR", "TE"];

const teamAliases: Record<string, string> = {
  ARI: "ARI",
  ATL: "ATL",
  BAL: "BAL",
  BUF: "BUF",
  CAR: "CAR",
  CHI: "CHI",
  CIN: "CIN",
  CLE: "CLE",
  DAL: "DAL",
  DEN: "DEN",
  DET: "DET",
  GB: "GB",
  GNB: "GB",
  HOU: "HOU",
  IND: "IND",
  JAX: "JAX",
  KC: "KC",
  KAN: "KC",
  LAC: "LAC",
  LAR: "LAR",
  LV: "LV",
  LVR: "LV",
  MIA: "MIA",
  MIN: "MIN",
  NE: "NE",
  NWE: "NE",
  NO: "NO",
  NOR: "NO",
  NYG: "NYG",
  NYJ: "NYJ",
  PHI: "PHI",
  PIT: "PIT",
  SEA: "SEA",
  SF: "SF",
  SFO: "SF",
  TB: "TB",
  TAM: "TB",
  TEN: "TEN",
  WAS: "WSH",
  WSH: "WSH"
};

function normalizeTeam(team: string) {
  return teamAliases[team] ?? team;
}

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/\b(jr|sr|iii|ii|iv)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseOpponent(result: string) {
  const match = result.match(/\b(?:vs\.|at)\s+([A-Z]{2,3})\b/);
  return match ? normalizeTeam(match[1]) : "NFL";
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function tierFromRank(rank: number) {
  if (rank <= 8) {
    return "tough defense";
  }
  if (rank <= 16) {
    return "above-average defense";
  }
  if (rank <= 24) {
    return "average defense";
  }
  return "friendly defense";
}

function tierFromFactor(factor: number) {
  if (factor <= 0.9) {
    return "tough defense vs similar players";
  }
  if (factor <= 0.98) {
    return "above-average defense vs similar players";
  }
  if (factor >= 1.08) {
    return "friendly defense vs similar players";
  }
  return "average defense vs similar players";
}

function positionScale(position: ProjectionPosition) {
  if (position === "QB") {
    return { opportunity: 12, points: 8, yards: 80, targets: 1, outperformance: 5 };
  }
  if (position === "RB") {
    return { opportunity: 6, points: 6, yards: 40, targets: 3, outperformance: 4 };
  }
  if (position === "TE") {
    return { opportunity: 3, points: 5, yards: 28, targets: 3, outperformance: 3.5 };
  }
  return { opportunity: 3.5, points: 5, yards: 35, targets: 3, outperformance: 3.5 };
}

function byeWeekForTeam(team: string) {
  const hash = team.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 5 + (hash % 9);
}

const playerMoves = new Map(
  movementRows
    .filter((row) => row.type === "player")
    .map((row) => [normalizeName(row.name), { fromTeam: normalizeTeam(row.fromTeam), toTeam: normalizeTeam(row.toTeam) }])
);

const coachMoves = movementRows
  .filter((row) => row.type === "coach")
  .map((row) => ({
    fromTeam: normalizeTeam(row.fromTeam.split(" ")[0]),
    toTeam: normalizeTeam(row.toTeam)
  }));

const defenseAverages = new Map<string, Map<ProjectionPosition, number[]>>();

for (const row of fantasyWeeklyRows) {
  if (!positions.includes(row.position as ProjectionPosition)) {
    continue;
  }
  const opponent = parseOpponent(row.result);
  const position = row.position as ProjectionPosition;
  const teamMap = defenseAverages.get(opponent) ?? new Map<ProjectionPosition, number[]>();
  const values = teamMap.get(position) ?? [];
  values.push(row.fantasyPoints);
  teamMap.set(position, values);
  defenseAverages.set(opponent, teamMap);
}

const defenseRanks = new Map<string, Map<ProjectionPosition, number>>();

for (const position of positions) {
  const ranked = [...defenseAverages.entries()]
    .map(([team, values]) => ({ team, allowed: average(values.get(position) ?? []) }))
    .filter((row) => row.allowed > 0)
    .sort((a, b) => a.allowed - b.allowed);

  ranked.forEach((row, index) => {
    const teamMap = defenseRanks.get(row.team) ?? new Map<ProjectionPosition, number>();
    teamMap.set(position, index + 1);
    defenseRanks.set(row.team, teamMap);
  });
}

const weeklyByPlayer = new Map<string, WeeklySample[]>();

for (const row of fantasyWeeklyRows) {
  if (!positions.includes(row.position as ProjectionPosition)) {
    continue;
  }
  const playerKey = normalizeName(row.player);
  const position = row.position as ProjectionPosition;
  const opponent = parseOpponent(row.result);
  const opponentRank = defenseRanks.get(opponent)?.get(position) ?? 16;
  const sample = {
    week: row.week,
    points: row.fantasyPoints,
    opponent,
    opponentRank,
    opponentTier: tierFromRank(opponentRank)
  };
  weeklyByPlayer.set(playerKey, [...(weeklyByPlayer.get(playerKey) ?? []), sample]);
}

function getSeasonRows(player: string, position: ProjectionPosition) {
  const playerKey = normalizeName(player);
  return fantasySeasonRows.filter((row) => normalizeName(row.player) === playerKey && row.position === position);
}

function getTeamPositionRows(team: string, position: ProjectionPosition) {
  const normalizedTeam = normalizeTeam(team);
  return fantasyDraftRows.filter((row) => normalizeTeam(row.team) === normalizedTeam && row.position === position);
}

function opportunityForPlayer(player: string, position: ProjectionPosition) {
  const rows = getSeasonRows(player, position);
  const games = fantasyDraftRows.find((row) => normalizeName(row.player) === normalizeName(player))?.games ?? 17;

  if (position === "QB") {
    const passing = rows.find((row) => row.category === "passing");
    return Number(passing?.stats.attempts ?? 0) / Math.max(games, 1);
  }
  if (position === "RB") {
    const rushing = rows.find((row) => row.category === "rushing");
    const receiving = rows.find((row) => row.category === "receiving");
    return (Number(rushing?.stats.carries ?? 0) + Number(receiving?.stats.targets ?? 0)) / Math.max(games, 1);
  }
  const receiving = rows.find((row) => row.category === "receiving");
  return Number(receiving?.stats.targets ?? 0) / Math.max(games, 1);
}

const offensiveProfiles: OffensiveProfile[] = fantasyDraftRows
  .filter((row) => positions.includes(row.position as ProjectionPosition) && row.actualPoints > 25)
  .map((row) => {
    const position = row.position as ProjectionPosition;
    return {
      key: normalizeName(row.player),
      player: row.player,
      position,
      pointsPerGame: row.actualPoints / Math.max(row.games, 1),
      opportunityPerGame: opportunityForPlayer(row.player, position),
      targetsPerGame: row.targetsPerGame,
      yardsPerGame: row.averageWeeklyYards,
      outperformancePerGame: row.outperformance / Math.max(row.games, 1)
    };
  });

const profilesByKey = new Map(offensiveProfiles.map((profile) => [profile.key, profile]));

function similarityScore(target: OffensiveProfile, comp: OffensiveProfile) {
  if (target.position !== comp.position) {
    return Number.POSITIVE_INFINITY;
  }

  const scale = positionScale(target.position);
  return (
    Math.abs(target.pointsPerGame - comp.pointsPerGame) / scale.points +
    Math.abs(target.opportunityPerGame - comp.opportunityPerGame) / scale.opportunity +
    Math.abs(target.yardsPerGame - comp.yardsPerGame) / scale.yards +
    Math.abs(target.targetsPerGame - comp.targetsPerGame) / scale.targets +
    Math.abs(target.outperformancePerGame - comp.outperformancePerGame) / scale.outperformance
  );
}

function getSimilarProfiles(playerKey: string, position: ProjectionPosition) {
  const target = profilesByKey.get(playerKey);
  if (!target) {
    return offensiveProfiles.filter((profile) => profile.position === position).slice(0, 10);
  }

  return offensiveProfiles
    .filter((profile) => profile.position === position && profile.key !== playerKey)
    .map((profile) => ({ profile, score: similarityScore(target, profile) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 12)
    .map((item) => item.profile);
}

function similarDefenseFactor(playerKey: string, opponent: string, position: ProjectionPosition, fallbackFactor: number) {
  const similarProfiles = getSimilarProfiles(playerKey, position);
  const ratios = similarProfiles.flatMap((profile) => {
    const samples = (weeklyByPlayer.get(profile.key) ?? []).filter((sample) => sample.opponent === opponent);
    return samples.map((sample) => sample.points / Math.max(profile.pointsPerGame, 1));
  });

  if (ratios.length === 0) {
    return {
      factor: fallbackFactor,
      sampleCount: 0,
      comps: similarProfiles.slice(0, 3).map((profile) => profile.player)
    };
  }

  return {
    factor: clamp(average(ratios), 0.78, 1.22),
    sampleCount: ratios.length,
    comps: similarProfiles.slice(0, 3).map((profile) => profile.player)
  };
}

function getChangedTeamAdjustment(player: string, position: ProjectionPosition, toTeam: string) {
  const oldOpportunity = opportunityForPlayer(player, position);
  if (oldOpportunity <= 0) {
    return 1;
  }

  const comparable = getTeamPositionRows(toTeam, position)
    .filter((row) => normalizeName(row.player) !== normalizeName(player))
    .sort((a, b) => b.actualPoints / Math.max(b.games, 1) - a.actualPoints / Math.max(a.games, 1))[0];

  if (!comparable) {
    return 1;
  }

  const comparableOpportunity = opportunityForPlayer(comparable.player, position);
  if (comparableOpportunity <= 0) {
    return 1;
  }

  return clamp(comparableOpportunity / oldOpportunity, 0.78, 1.18);
}

function getCoachAdjustment(team: string, position: ProjectionPosition) {
  const coachMove = coachMoves.find((move) => move.toTeam === team);
  if (!coachMove) {
    return 1;
  }

  const previousPlayers = getTeamPositionRows(coachMove.fromTeam, position);
  const newPlayers = getTeamPositionRows(coachMove.toTeam, position);
  const oldAverage = average(previousPlayers.map((row) => row.actualPoints / Math.max(row.games, 1)).filter(Boolean));
  const newAverage = average(newPlayers.map((row) => row.actualPoints / Math.max(row.games, 1)).filter(Boolean));

  if (oldAverage <= 0 || newAverage <= 0) {
    return 1.03;
  }

  return clamp(oldAverage / newAverage, 0.9, 1.12);
}

function makeWeeklyProjection(playerKey: string, team: string, baseWeeklyPoints: number, position: ProjectionPosition) {
  const samples = [...(weeklyByPlayer.get(playerKey) ?? [])].sort((a, b) => a.week - b.week);
  const byTier = new Map<string, number[]>();
  const byeWeek = byeWeekForTeam(team);
  const weeks: FantasyProjectionWeek[] = [];

  for (const sample of samples) {
    byTier.set(sample.opponentTier, [...(byTier.get(sample.opponentTier) ?? []), sample.points]);
  }

  const fallbackTiers = ["above-average defense", "average defense", "friendly defense", "tough defense"];

  for (let week = 1; week <= 18; week += 1) {
    if (week === byeWeek) {
      weeks.push({
        week,
        opponentTier: "bye",
        projectedPoints: 0,
        defenseAdjustment: 0,
        basis: "Projected bye"
      });
      continue;
    }

    const sample = samples[(week - 1) % Math.max(samples.length, 1)];
    const opponentTier = sample?.opponentTier ?? fallbackTiers[(week - 1) % fallbackTiers.length];
    const tierPoints = average(byTier.get(opponentTier) ?? []);
    const tierFactor = opponentTier === "tough defense" ? 0.92 : opponentTier === "above-average defense" ? 0.97 : opponentTier === "friendly defense" ? 1.08 : 1;
    const similarDefense = sample
      ? similarDefenseFactor(playerKey, sample.opponent, position, tierFactor)
      : { factor: tierFactor, sampleCount: 0, comps: getSimilarProfiles(playerKey, position).slice(0, 3).map((profile) => profile.player) };
    const projectedPoints =
      tierPoints > 0
        ? tierPoints * 0.45 + baseWeeklyPoints * similarDefense.factor * 0.55
        : baseWeeklyPoints * similarDefense.factor;
    const compNames = similarDefense.comps.length > 0 ? similarDefense.comps.join(", ") : `${position} baseline`;

    weeks.push({
      week,
      opponentTier: similarDefense.sampleCount > 0 ? tierFromFactor(similarDefense.factor) : opponentTier,
      projectedPoints,
      defenseAdjustment: similarDefense.factor,
      basis: sample
        ? `Similar-player comps vs ${sample.opponent}: ${compNames}${similarDefense.sampleCount > 0 ? ` (${similarDefense.sampleCount} matchup${similarDefense.sampleCount === 1 ? "" : "s"})` : "; fallback to defense tier"}`
        : `Similar-player baseline: ${compNames}`
    });
  }

  return weeks;
}

export const fantasyProjectionRows: FantasyProjectionRow[] = fantasyDraftRows
  .filter((row) => positions.includes(row.position as ProjectionPosition) && row.actualPoints > 25)
  .map((row) => {
    const playerKey = normalizeName(row.player);
    const position = row.position as ProjectionPosition;
    const move = playerMoves.get(playerKey);
    const team = move?.toTeam ?? normalizeTeam(row.team);
    const previousTeam = normalizeTeam(row.team);
    const baseWeeklyPoints = row.actualPoints / Math.max(row.games, 1);
    const teamAdjustment = move ? getChangedTeamAdjustment(row.player, position, team) : 1;
    const coachAdjustment = getCoachAdjustment(team, position);
    const adjustedWeeklyPoints = baseWeeklyPoints * teamAdjustment * coachAdjustment;
    const weeks = makeWeeklyProjection(playerKey, team, adjustedWeeklyPoints, position);
    const projectedPoints = weeks.reduce((sum, week) => sum + week.projectedPoints, 0);
    const defenseAdjustment = projectedPoints / Math.max(adjustedWeeklyPoints * 17, 1);
    const sampleCount = weeklyByPlayer.get(playerKey)?.length ?? 0;
    const confidence = clamp(55 + sampleCount * 2 + row.games - Math.abs(1 - teamAdjustment) * 35, 45, 92);
    const notes = [];

    if (move) {
      notes.push(`team change workload based on ${team} ${position} usage`);
    }
    if (coachAdjustment !== 1) {
      notes.push(`coach context compared to prior ${position} production`);
    }
    if (notes.length === 0) {
      notes.push("2025 weekly profile adjusted by how defenses performed against similar offensive players");
    }

    return {
      rank: 0,
      player: row.player,
      team,
      previousTeam,
      position,
      projectedPoints,
      projectedWeeklyAverage: projectedPoints / 17,
      points2025: row.actualPoints,
      games2025: row.games,
      teamAdjustment,
      coachAdjustment,
      defenseAdjustment,
      confidence,
      note: notes.join("; "),
      weeks
    };
  })
  .sort((a, b) => b.projectedPoints - a.projectedPoints)
  .map((row, index) => ({ ...row, rank: index + 1 }));

export const fantasyProjectionSummary = {
  source:
    "2026 projections use 2025 weekly fantasy results, similar offensive player comps, defense results against those comps, player movement workload comps, and head-coach team context adjustments.",
  players: fantasyProjectionRows.length
} as const;
