import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const reportsPath = "lib/data/scouting-reports.ts";
const rostersPath = "lib/data/mlb-rosters.ts";
const outputPath = "lib/data/generated-player-stats.ts";
const generatedStatsDir = "public/generated-player-stats";

function unique(values) {
  return [...new Set(values)];
}

function getMlbPlayerIds(reportsSource) {
  return unique([...reportsSource.matchAll(/mlbPlayerId:\s*(\d+)/g)].map((match) => Number(match[1])));
}

function getRosterPlayerIds(rostersSource) {
  return unique([...rostersSource.matchAll(/"id":\s*(\d+)/g)].map((match) => Number(match[1])));
}

function statValue(stat, key, fallback = "-") {
  const value = stat?.[key];

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value);
}

function slugifyName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatBirthPlace(person) {
  return [person.birthCity, person.birthStateProvince, person.birthCountry].filter(Boolean).join(", ") || "NA";
}

function formatPreProPath(person) {
  const draftSchool = person.drafts?.[0]?.school?.name;
  const college = person.education?.colleges?.[0]?.name;
  const highSchool = person.education?.highschools?.[0];

  if (draftSchool || college) {
    return draftSchool ?? college;
  }

  if (highSchool?.name) {
    return `${highSchool.name} HS${highSchool.state ? ` (${highSchool.state})` : ""}`;
  }

  return person.draftYear ? `Signed/Drafted ${person.draftYear}` : "NA";
}

async function getJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed ${response.status}: ${url}`);
  }

  return response.json();
}

const gameDayNightByGamePk = new Map();

function chunkItems(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function hydrateGameDayNight(gameLogs) {
  const gamePks = unique(gameLogs.map((split) => split.game?.gamePk).filter(Boolean));
  const missingGamePks = gamePks.filter((gamePk) => !gameDayNightByGamePk.has(gamePk));

  await mapWithConcurrency(chunkItems(missingGamePks, 100), 4, async (gamePkChunk) => {
    const response = await getJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&gamePks=${gamePkChunk.join(",")}`);
    const games = response.dates?.flatMap((date) => date.games ?? []) ?? [];

    for (const game of games) {
      gameDayNightByGamePk.set(game.gamePk, game.dayNight);
    }
  });

  return gameLogs.map((split) => ({
    ...split,
    game: {
      ...split.game,
      dayNight: gameDayNightByGamePk.get(split.game?.gamePk) ?? split.game?.dayNight
    }
  }));
}

function getSplit(stats, type, group) {
  return stats.find((entry) => entry.type?.displayName === type && entry.group?.displayName === group)?.splits ?? [];
}

function getPrimaryGroup(stats) {
  const careerHitting = getSplit(stats, "career", "hitting")[0]?.stat;
  const careerPitching = getSplit(stats, "career", "pitching")[0]?.stat;
  const plateAppearances = Number(careerHitting?.plateAppearances ?? 0);
  const inningsPitched = Number.parseFloat(careerPitching?.inningsPitched ?? "0");

  return inningsPitched > 0 && plateAppearances < 100 ? "pitching" : "hitting";
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const splitDefinitions = [
  { key: "all", label: "All games" },
  { key: "home", label: "Home", sitCode: "h" },
  { key: "away", label: "Away", sitCode: "a" },
  { key: "day", label: "Day", sitCode: "d" },
  { key: "night", label: "Night", sitCode: "n" }
];

function buildStatRows(splits, statLabels, labelFormatter) {
  return splits.map((split) => ({
    season: labelFormatter(split),
    team: split.team?.abbreviation ?? split.team?.name ?? "-",
    level: split.sport?.abbreviation ?? "MLB",
    stats: statLabels.map(([label, key]) => ({ label, value: statValue(split.stat, key) }))
  }));
}

function formatSeasonLabel(split) {
  return split.season;
}

function formatMonthLabel(split) {
  const monthName = monthNames[(Number(split.month) || 1) - 1] ?? `Month ${split.month}`;

  return `${monthName} ${split.season}`;
}

function getPlayerSeasons(yearByYear) {
  return unique(yearByYear.map((split) => split.season).filter(Boolean)).sort((first, second) => Number(first) - Number(second));
}

function formatRate(value, decimals = 3) {
  if (!Number.isFinite(value)) {
    return ".---";
  }

  if (decimals === 3) {
    return value.toFixed(3).replace(/^0/, "");
  }

  return value.toFixed(decimals);
}

function parseOuts(stat) {
  if (Number.isFinite(Number(stat?.outs))) {
    return Number(stat.outs);
  }

  const innings = String(stat?.inningsPitched ?? "0");
  const [whole, partial = "0"] = innings.split(".");

  return Number(whole) * 3 + Number(partial);
}

function formatInningsFromOuts(outs) {
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

function sumStat(splits, key) {
  return splits.reduce((total, split) => total + Number(split.stat?.[key] ?? 0), 0);
}

function buildHittingMonthlyRowsFromGames(gameLogs, statLabels, filter) {
  const filteredGames = gameLogs.filter((split) => {
    if (filter.key === "home") return split.isHome;
    if (filter.key === "away") return !split.isHome;
    if (filter.key === "day") return split.game?.dayNight === "day";
    if (filter.key === "night") return split.game?.dayNight === "night";
    return true;
  });
  const monthGroups = new Map();

  for (const split of filteredGames) {
    const date = new Date(`${split.date}T00:00:00Z`);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
    const current = monthGroups.get(key) ?? [];

    current.push(split);
    monthGroups.set(key, current);
  }

  return [...monthGroups.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, splits]) => {
      const [season, month] = key.split("-").map(Number);
      const atBats = sumStat(splits, "atBats");
      const hits = sumStat(splits, "hits");
      const walks = sumStat(splits, "baseOnBalls");
      const hitByPitch = sumStat(splits, "hitByPitch");
      const sacrificeFlies = sumStat(splits, "sacFlies");
      const totalBases = sumStat(splits, "totalBases");
      const statsByKey = {
        gamesPlayed: sumStat(splits, "gamesPlayed"),
        plateAppearances: sumStat(splits, "plateAppearances"),
        avg: formatRate(atBats ? hits / atBats : Number.NaN),
        obp: formatRate(atBats + walks + hitByPitch + sacrificeFlies ? (hits + walks + hitByPitch) / (atBats + walks + hitByPitch + sacrificeFlies) : Number.NaN),
        slg: formatRate(atBats ? totalBases / atBats : Number.NaN),
        ops: formatRate(
          (atBats + walks + hitByPitch + sacrificeFlies ? (hits + walks + hitByPitch) / (atBats + walks + hitByPitch + sacrificeFlies) : Number.NaN) +
            (atBats ? totalBases / atBats : Number.NaN)
        ),
        homeRuns: sumStat(splits, "homeRuns"),
        rbi: sumStat(splits, "rbi"),
        stolenBases: sumStat(splits, "stolenBases")
      };

      return {
        season: `${monthNames[month - 1]} ${season}`,
        team: splits.at(-1)?.team?.abbreviation ?? splits.at(-1)?.team?.name ?? "-",
        level: splits.at(-1)?.sport?.abbreviation ?? "MLB",
        stats: statLabels.map(([label, keyName]) => ({ label, value: statValue(statsByKey, keyName) }))
      };
    });
}

function buildHittingSeasonRowsFromGames(gameLogs, statLabels, filter) {
  const filteredGames = gameLogs.filter((split) => {
    if (filter.key === "home") return split.isHome;
    if (filter.key === "away") return !split.isHome;
    if (filter.key === "day") return split.game?.dayNight === "day";
    if (filter.key === "night") return split.game?.dayNight === "night";
    return true;
  });
  const seasonGroups = new Map();

  for (const split of filteredGames) {
    const current = seasonGroups.get(split.season) ?? [];

    current.push(split);
    seasonGroups.set(split.season, current);
  }

  return [...seasonGroups.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([season, splits]) => {
      const atBats = sumStat(splits, "atBats");
      const hits = sumStat(splits, "hits");
      const walks = sumStat(splits, "baseOnBalls");
      const hitByPitch = sumStat(splits, "hitByPitch");
      const sacrificeFlies = sumStat(splits, "sacFlies");
      const totalBases = sumStat(splits, "totalBases");
      const statsByKey = {
        gamesPlayed: sumStat(splits, "gamesPlayed"),
        plateAppearances: sumStat(splits, "plateAppearances"),
        avg: formatRate(atBats ? hits / atBats : Number.NaN),
        obp: formatRate(
          atBats + walks + hitByPitch + sacrificeFlies
            ? (hits + walks + hitByPitch) / (atBats + walks + hitByPitch + sacrificeFlies)
            : Number.NaN
        ),
        slg: formatRate(atBats ? totalBases / atBats : Number.NaN),
        ops: formatRate(
          (atBats + walks + hitByPitch + sacrificeFlies
            ? (hits + walks + hitByPitch) / (atBats + walks + hitByPitch + sacrificeFlies)
            : Number.NaN) + (atBats ? totalBases / atBats : Number.NaN)
        ),
        homeRuns: sumStat(splits, "homeRuns"),
        rbi: sumStat(splits, "rbi"),
        stolenBases: sumStat(splits, "stolenBases")
      };

      return {
        season,
        team: splits.at(-1)?.team?.abbreviation ?? splits.at(-1)?.team?.name ?? "-",
        level: splits.at(-1)?.sport?.abbreviation ?? "MLB",
        stats: statLabels.map(([label, keyName]) => ({ label, value: statValue(statsByKey, keyName) }))
      };
    });
}

function buildPitchingMonthlyRowsFromGames(gameLogs, statLabels, filter) {
  const filteredGames = gameLogs.filter((split) => {
    if (filter.key === "home") return split.isHome;
    if (filter.key === "away") return !split.isHome;
    if (filter.key === "day") return split.game?.dayNight === "day";
    if (filter.key === "night") return split.game?.dayNight === "night";
    return true;
  });
  const monthGroups = new Map();

  for (const split of filteredGames) {
    const date = new Date(`${split.date}T00:00:00Z`);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
    const current = monthGroups.get(key) ?? [];

    current.push(split);
    monthGroups.set(key, current);
  }

  return [...monthGroups.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, splits]) => {
      const [season, month] = key.split("-").map(Number);
      const outs = splits.reduce((total, split) => total + parseOuts(split.stat), 0);
      const innings = outs / 3;
      const walks = sumStat(splits, "baseOnBalls");
      const hits = sumStat(splits, "hits");
      const earnedRuns = sumStat(splits, "earnedRuns");
      const statsByKey = {
        gamesPlayed: sumStat(splits, "gamesPlayed"),
        gamesStarted: sumStat(splits, "gamesStarted"),
        inningsPitched: formatInningsFromOuts(outs),
        era: formatRate(innings ? (earnedRuns * 9) / innings : Number.NaN, 2),
        whip: formatRate(innings ? (walks + hits) / innings : Number.NaN, 2),
        strikeOuts: sumStat(splits, "strikeOuts"),
        baseOnBalls: walks,
        homeRuns: sumStat(splits, "homeRuns")
      };

      return {
        season: `${monthNames[month - 1]} ${season}`,
        team: splits.at(-1)?.team?.abbreviation ?? splits.at(-1)?.team?.name ?? "-",
        level: splits.at(-1)?.sport?.abbreviation ?? "MLB",
        stats: statLabels.map(([label, keyName]) => ({ label, value: statValue(statsByKey, keyName) }))
      };
    });
}

function buildPitchingSeasonRowsFromGames(gameLogs, statLabels, filter) {
  const filteredGames = gameLogs.filter((split) => {
    if (filter.key === "home") return split.isHome;
    if (filter.key === "away") return !split.isHome;
    if (filter.key === "day") return split.game?.dayNight === "day";
    if (filter.key === "night") return split.game?.dayNight === "night";
    return true;
  });
  const seasonGroups = new Map();

  for (const split of filteredGames) {
    const current = seasonGroups.get(split.season) ?? [];

    current.push(split);
    seasonGroups.set(split.season, current);
  }

  return [...seasonGroups.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([season, splits]) => {
      const outs = splits.reduce((total, split) => total + parseOuts(split.stat), 0);
      const innings = outs / 3;
      const walks = sumStat(splits, "baseOnBalls");
      const hits = sumStat(splits, "hits");
      const earnedRuns = sumStat(splits, "earnedRuns");
      const statsByKey = {
        gamesPlayed: sumStat(splits, "gamesPlayed"),
        gamesStarted: sumStat(splits, "gamesStarted"),
        inningsPitched: formatInningsFromOuts(outs),
        era: formatRate(innings ? (earnedRuns * 9) / innings : Number.NaN, 2),
        whip: formatRate(innings ? (walks + hits) / innings : Number.NaN, 2),
        strikeOuts: sumStat(splits, "strikeOuts"),
        baseOnBalls: walks,
        homeRuns: sumStat(splits, "homeRuns")
      };

      return {
        season,
        team: splits.at(-1)?.team?.abbreviation ?? splits.at(-1)?.team?.name ?? "-",
        level: splits.at(-1)?.sport?.abbreviation ?? "MLB",
        stats: statLabels.map(([label, keyName]) => ({ label, value: statValue(statsByKey, keyName) }))
      };
    });
}

function buildHittingHistory(yearByYear, career, byMonth, careerGameLogs, monthlyGameLogs) {
  const statLabels = [
    ["G", "gamesPlayed"],
    ["PA", "plateAppearances"],
    ["AVG", "avg"],
    ["OBP", "obp"],
    ["SLG", "slg"],
    ["OPS", "ops"],
    ["HR", "homeRuns"],
    ["RBI", "rbi"],
    ["SB", "stolenBases"]
  ];

  const seasons = buildStatRows(yearByYear, statLabels, formatSeasonLabel);
  const gameLogMonths = buildHittingMonthlyRowsFromGames(monthlyGameLogs, statLabels, splitDefinitions[0]);
  const months = gameLogMonths.length ? gameLogMonths : buildStatRows(byMonth, statLabels, formatMonthLabel);

  return {
    type: "hitter",
    source: "MLB Stats API",
    seasons,
    months,
    splitSeries: splitDefinitions.map((split) => ({
      key: split.key,
      label: split.label,
      seasons: split.key === "all" ? seasons : buildHittingSeasonRowsFromGames(careerGameLogs, statLabels, split),
      months: split.key === "all" ? months : buildHittingMonthlyRowsFromGames(monthlyGameLogs, statLabels, split)
    })),
    career: statLabels.map(([label, key]) => ({ label, value: statValue(career, key) }))
  };
}

function buildPitchingHistory(yearByYear, career, byMonth, careerGameLogs, monthlyGameLogs) {
  const statLabels = [
    ["G", "gamesPlayed"],
    ["GS", "gamesStarted"],
    ["IP", "inningsPitched"],
    ["ERA", "era"],
    ["WHIP", "whip"],
    ["K", "strikeOuts"],
    ["BB", "baseOnBalls"],
    ["HR", "homeRuns"]
  ];

  const seasons = buildStatRows(yearByYear, statLabels, formatSeasonLabel);
  const gameLogMonths = buildPitchingMonthlyRowsFromGames(monthlyGameLogs, statLabels, splitDefinitions[0]);
  const months = gameLogMonths.length ? gameLogMonths : buildStatRows(byMonth, statLabels, formatMonthLabel);

  return {
    type: "pitcher",
    source: "MLB Stats API",
    seasons,
    months,
    splitSeries: splitDefinitions.map((split) => ({
      key: split.key,
      label: split.label,
      seasons: split.key === "all" ? seasons : buildPitchingSeasonRowsFromGames(careerGameLogs, statLabels, split),
      months: split.key === "all" ? months : buildPitchingMonthlyRowsFromGames(monthlyGameLogs, statLabels, split)
    })),
    career: statLabels.map(([label, key]) => ({ label, value: statValue(career, key) }))
  };
}

function buildHittingGroups(history) {
  const latest = history.seasons.at(-1);
  const careerStats = new Map(history.career.map((stat) => [stat.label, stat.value]));

  return [
    {
      title: latest ? `${latest.season} Season Line` : "Season Line",
      source: "MLB Stats API",
      stats: latest?.stats ?? []
    },
    {
      title: "Career Line",
      source: "MLB Stats API",
      stats: ["G", "PA", "AVG", "OBP", "SLG", "OPS", "HR", "RBI", "SB"].map((label) => ({
        label,
        value: careerStats.get(label) ?? "-"
      }))
    }
  ];
}

function buildPitchingGroups(history) {
  const latest = history.seasons.at(-1);
  const careerStats = new Map(history.career.map((stat) => [stat.label, stat.value]));

  return [
    {
      title: latest ? `${latest.season} Season Line` : "Season Line",
      source: "MLB Stats API",
      stats: latest?.stats ?? []
    },
    {
      title: "Career Line",
      source: "MLB Stats API",
      stats: ["G", "GS", "IP", "ERA", "WHIP", "K", "BB", "HR"].map((label) => ({
        label,
        value: careerStats.get(label) ?? "-"
      }))
    }
  ];
}

async function buildPlayerStats(mlbPlayerId) {
  const [personResponse, response] = await Promise.all([
    getJson(`https://statsapi.mlb.com/api/v1/people/${mlbPlayerId}?hydrate=education,draft`),
    getJson(`https://statsapi.mlb.com/api/v1/people/${mlbPlayerId}/stats?stats=yearByYear,career,byMonth&group=hitting,pitching`)
  ]);
  const person = personResponse.people?.[0] ?? {};
  const stats = response.stats ?? [];
  const primaryGroup = getPrimaryGroup(stats);
  const yearByYear = getSplit(stats, "yearByYear", primaryGroup);
  const byMonth = getSplit(stats, "byMonth", primaryGroup).sort((a, b) => Number(a.month) - Number(b.month));
  const career = getSplit(stats, "career", primaryGroup)[0]?.stat ?? {};
  const playerName = person.fullName ?? yearByYear[0]?.player?.fullName ?? `MLB Player ${mlbPlayerId}`;
  const playerSeasons = getPlayerSeasons(yearByYear);
  const latestSeason = playerSeasons.at(-1);
  const gameLogResponses = await mapWithConcurrency(playerSeasons, 4, (season) =>
    getJson(`https://statsapi.mlb.com/api/v1/people/${mlbPlayerId}/stats?stats=gameLog&group=${primaryGroup}&season=${season}`)
  );
  const gameLogs = await hydrateGameDayNight(
    gameLogResponses.flatMap((gameLogResponse) => getSplit(gameLogResponse.stats ?? [], "gameLog", primaryGroup))
  );
  const monthlyGameLogs = latestSeason ? gameLogs.filter((split) => split.season === latestSeason) : gameLogs;
  const history =
    primaryGroup === "pitching"
      ? buildPitchingHistory(yearByYear, career, byMonth, gameLogs, monthlyGameLogs)
      : buildHittingHistory(yearByYear, career, byMonth, gameLogs, monthlyGameLogs);

  return {
    mlbPlayerId,
    playerName,
    lastUpdated: new Date().toISOString(),
    age: person.currentAge,
    birthPlace: formatBirthPlace(person),
    preProPath: formatPreProPath(person),
    statGroups: primaryGroup === "pitching" ? buildPitchingGroups(history) : buildHittingGroups(history),
    statHistory: history,
    sourceLinks: [
      { label: "MLB Stats", url: `https://www.mlb.com/player/${mlbPlayerId}` },
      { label: "Baseball Savant", url: `https://baseballsavant.mlb.com/savant-player/${slugifyName(playerName)}-${mlbPlayerId}` },
      { label: "FanGraphs", url: "https://www.fangraphs.com/players" },
      { label: "Baseball Reference", url: "https://www.baseball-reference.com/players/" }
    ]
  };
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const reportsSource = await readFile(reportsPath, "utf8");
const rostersSource = await readFile(rostersPath, "utf8");
const reportPlayerIds = getMlbPlayerIds(reportsSource);
const rosterPlayerIds = process.argv.includes("--reports-only") ? [] : getRosterPlayerIds(rostersSource);
const mlbPlayerIds = unique([...reportPlayerIds, ...rosterPlayerIds]);
const generatedStatsLastUpdated = new Date().toISOString();

await rm(generatedStatsDir, { recursive: true, force: true });
await mkdir(generatedStatsDir, { recursive: true });

const playerStats = await mapWithConcurrency(mlbPlayerIds, 10, async (mlbPlayerId, index) => {
  const stats = await buildPlayerStats(mlbPlayerId);
  console.log(`Fetched ${index + 1}/${mlbPlayerIds.length}: ${stats.playerName}`);
  return stats;
});

await Promise.all(
  playerStats.map((stats) => writeFile(`${generatedStatsDir}/${stats.mlbPlayerId}.json`, JSON.stringify(stats)))
);

const output = `import type { SourceLink, StatGroup, StatHistory } from "@/lib/data/scouting-reports";

export type GeneratedPlayerStats = {
  mlbPlayerId: number;
  playerName: string;
  lastUpdated: string;
  age?: number;
  birthPlace?: string;
  preProPath?: string;
  statGroups: StatGroup[];
  statHistory: StatHistory;
  sourceLinks: SourceLink[];
};

export const generatedStatsLastUpdated = ${JSON.stringify(generatedStatsLastUpdated)};
export const generatedPlayerStatIds = ${JSON.stringify(mlbPlayerIds)};

const statsCache = new Map<number, GeneratedPlayerStats | undefined>();

export async function fetchGeneratedPlayerStats(mlbPlayerId: number) {
  if (statsCache.has(mlbPlayerId)) {
    return statsCache.get(mlbPlayerId);
  }

  try {
    const response = await fetch(\`/generated-player-stats/\${mlbPlayerId}.json\`);

    if (!response.ok) {
      statsCache.set(mlbPlayerId, undefined);
      return undefined;
    }

    const stats = (await response.json()) as GeneratedPlayerStats;
    statsCache.set(mlbPlayerId, stats);
    return stats;
  } catch {
    statsCache.set(mlbPlayerId, undefined);
    return undefined;
  }
}
`;

await writeFile(outputPath, output);
console.log(`Updated generated stats for ${mlbPlayerIds.length} player${mlbPlayerIds.length === 1 ? "" : "s"}.`);
