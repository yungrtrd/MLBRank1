import fs from "node:fs";
import path from "node:path";

import { firstValue, slugify, toNumber, toRows, type CsvRow } from "@/lib/csv";
import {
  ImportedSituationDataset,
  Player,
  SituationFilter,
  SituationSplit
} from "@/lib/types";

function readFlag(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function parseRequiredNumberFlag(flag: string) {
  const value = readFlag(flag);
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${flag}`);
  }
  return parsed;
}

function parseSituationFilter() {
  const filter: SituationFilter = {
    inningMin: parseRequiredNumberFlag("--inning-min"),
    inningMax: parseRequiredNumberFlag("--inning-max"),
    maxRunMargin: parseRequiredNumberFlag("--max-run-margin")
  };

  if (!filter.inningMin && !filter.inningMax && !filter.maxRunMargin) {
    throw new Error(
      "Provide at least one situation flag: --inning-min, --inning-max, or --max-run-margin."
    );
  }

  return filter;
}

function buildSituationLabel(filter: SituationFilter, explicitLabel?: string) {
  if (explicitLabel) {
    return explicitLabel;
  }

  const parts: string[] = [];
  if (filter.inningMin) {
    parts.push(`After the ${filter.inningMin}${filter.inningMin === 1 ? "st" : filter.inningMin === 2 ? "nd" : filter.inningMin === 3 ? "rd" : "th"} inning`);
  }
  if (filter.inningMax) {
    parts.push(`Through inning ${filter.inningMax}`);
  }
  if (filter.maxRunMargin) {
    parts.push(`Within ${filter.maxRunMargin} runs`);
  }

  return parts.join(", ");
}

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
    bio: "Imported from Stathead split export."
  };
}

function buildSplit(
  row: CsvRow,
  filter: SituationFilter,
  label: string,
  playerId: string
): SituationSplit | null {
  const season = toNumber(firstValue(row, ["year", "season"]));
  if (!season) {
    return null;
  }

  const team = firstValue(row, ["team", "tm", "franchise"]) || "MLB";
  const plateAppearances = toNumber(firstValue(row, ["pa", "plate appearances"]));
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
    id: `${playerId}-${season}-${team.toLowerCase()}-${slugify(label)}`,
    playerId,
    season,
    role: "hitter",
    label,
    filter,
    sampleSizeLabel: plateAppearances ? `${plateAppearances} PA` : "Stathead split",
    stats: Object.fromEntries(
      Object.entries(stats).filter((entry): entry is [string, number] => typeof entry[1] === "number")
    ),
    sourceMap: Object.fromEntries(
      Object.keys(stats)
        .filter((key) => typeof stats[key as keyof typeof stats] === "number")
        .map((key) => [key, "Stathead split export"])
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

function buildDataset(rows: CsvRow[], filter: SituationFilter, label: string): ImportedSituationDataset {
  const players: Player[] = [];
  const splits: SituationSplit[] = [];

  for (const row of rows) {
    const season = toNumber(firstValue(row, ["year", "season"]));
    const team = firstValue(row, ["team", "tm", "franchise"]) || "MLB";
    if (!season) {
      continue;
    }

    const player = buildPlayer(row, season, team);
    if (!player) {
      continue;
    }

    const split = buildSplit(row, filter, label, player.id);
    if (!split) {
      continue;
    }

    players.push(player);
    splits.push(split);
  }

  return {
    source: "stathead-batting-splits",
    importedAt: new Date().toISOString(),
    rowCount: splits.length,
    players: mergePlayers(players),
    splits
  };
}

function readExistingSplits(outputPath: string): ImportedSituationDataset | null {
  if (!fs.existsSync(outputPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(outputPath, "utf8")) as ImportedSituationDataset;
}

function mergeDatasets(
  existing: ImportedSituationDataset | null,
  incoming: ImportedSituationDataset
): ImportedSituationDataset {
  if (!existing) {
    return incoming;
  }

  const byId = new Map<string, SituationSplit>();
  for (const split of [...existing.splits, ...incoming.splits]) {
    byId.set(split.id, split);
  }

  return {
    source: "stathead-batting-splits",
    importedAt: incoming.importedAt,
    rowCount: byId.size,
    players: mergePlayers([...existing.players, ...incoming.players]),
    splits: [...byId.values()]
  };
}

function main() {
  const inputArg = process.argv[2];
  if (!inputArg) {
    throw new Error(
      "Usage: npm run import:stathead-splits -- /absolute/path/to/export.csv --inning-min 7 --max-run-margin 2 [--label \"After the 7th inning, within 2 runs\"]"
    );
  }

  const filter = parseSituationFilter();
  const label = buildSituationLabel(filter, readFlag("--label"));
  const inputPath = path.resolve(process.cwd(), inputArg);
  const outputPath = path.join(process.cwd(), "data", "imported", "stathead-batting-situations.json");

  const csv = fs.readFileSync(inputPath, "utf8");
  const rows = toRows(csv);
  const incoming = buildDataset(rows, filter, label);
  const merged = mergeDatasets(readExistingSplits(outputPath), incoming);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(merged, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        inputPath,
        outputPath,
        label,
        filter,
        importedRows: incoming.rowCount,
        totalSplitRows: merged.rowCount,
        players: merged.players.length,
        importedAt: merged.importedAt
      },
      null,
      2
    )
  );
}

main();
