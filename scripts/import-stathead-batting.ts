import fs from "node:fs";
import path from "node:path";

import { firstValue, slugify, toNumber, toRows, type CsvRow } from "@/lib/csv";
import { ImportedDataset, Player, PlayerSeason } from "@/lib/types";

function buildPlayer(row: CsvRow, season: number, team: string): Player | null {
  const fullName =
    firstValue(row, ["name", "player", "player name", "batter", "batter name"]) ||
    firstValue(row, ["player_name"]);
  if (!fullName) {
    return null;
  }

  const id = slugify(fullName);
  return {
    id,
    slug: id,
    fullName,
    primaryRole: "hitter",
    bats: firstValue(row, ["bats"]) || "Unknown",
    throws: firstValue(row, ["throws"]) || "Unknown",
    teams: team ? [team] : [],
    debutYear: season,
    lastYear: season,
    aliases: [],
    bio: "Imported from Stathead batting-season export."
  };
}

function buildSeason(row: CsvRow, playerId: string): PlayerSeason | null {
  const season = toNumber(firstValue(row, ["year", "season"]));
  if (!season) {
    return null;
  }

  const team = firstValue(row, ["team", "tm", "franchise"]) || "MLB";
  const stats = {
    war: toNumber(firstValue(row, ["war"])),
    ops_plus: toNumber(firstValue(row, ["ops+"])),
    wrc_plus: toNumber(firstValue(row, ["wrc+"])),
    hr: toNumber(firstValue(row, ["hr", "home runs"])),
    avg: toNumber(firstValue(row, ["ba", "avg", "batting average"])),
    obp: toNumber(firstValue(row, ["obp"])),
    slg: toNumber(firstValue(row, ["slg"]))
  };

  return {
    id: `${playerId}-${season}-${team.toLowerCase()}-h`,
    playerId,
    season,
    team,
    role: "hitter",
    stats: Object.fromEntries(
      Object.entries(stats).filter((entry): entry is [string, number] => typeof entry[1] === "number")
    ),
    sourceMap: Object.fromEntries(
      Object.keys(stats)
        .filter((key) => typeof stats[key as keyof typeof stats] === "number")
        .map((key) => [key, "Stathead batting season export"])
    )
  };
}

function mergePlayers(players: Player[]) {
  const byId = new Map<string, Player>();

  for (const player of players) {
    const existing = byId.get(player.id);
    if (!existing) {
      byId.set(player.id, player);
      continue;
    }

    byId.set(player.id, {
      ...existing,
      teams: [...new Set([...existing.teams, ...player.teams])],
      debutYear: Math.min(existing.debutYear, player.debutYear),
      lastYear: Math.max(existing.lastYear, player.lastYear)
    });
  }

  return [...byId.values()].sort((left, right) => left.fullName.localeCompare(right.fullName));
}

function buildDataset(rows: CsvRow[]): ImportedDataset {
  const players: Player[] = [];
  const seasons: PlayerSeason[] = [];

  for (const row of rows) {
    const seasonYear = toNumber(firstValue(row, ["year", "season"]));
    const team = firstValue(row, ["team", "tm", "franchise"]) || "MLB";
    if (!seasonYear) {
      continue;
    }

    const player = buildPlayer(row, seasonYear, team);
    if (!player) {
      continue;
    }

    const season = buildSeason(row, player.id);
    if (!season) {
      continue;
    }

    players.push(player);
    seasons.push(season);
  }

  return {
    source: "stathead-batting",
    importedAt: new Date().toISOString(),
    rowCount: seasons.length,
    players: mergePlayers(players),
    seasons
  };
}

function main() {
  const inputArg = process.argv[2];
  if (!inputArg) {
    throw new Error("Usage: npm run import:stathead-batting -- /absolute/path/to/export.csv");
  }

  const inputPath = path.resolve(process.cwd(), inputArg);
  const outputPath = path.join(process.cwd(), "data", "imported", "stathead-batting-seasons.json");

  const csv = fs.readFileSync(inputPath, "utf8");
  const rows = toRows(csv);
  const dataset = buildDataset(rows);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        inputPath,
        outputPath,
        players: dataset.players.length,
        seasons: dataset.seasons.length,
        importedAt: dataset.importedAt
      },
      null,
      2
    )
  );
}

main();
