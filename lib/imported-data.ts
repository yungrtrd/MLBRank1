import fs from "node:fs";
import path from "node:path";

import { ImportedDataset, ImportedSituationDataset, Player, PlayerSeason, SituationSplit } from "@/lib/types";

const importedDatasetPath = path.join(process.cwd(), "data", "imported", "stathead-batting-seasons.json");
const importedSituationDatasetPath = path.join(
  process.cwd(),
  "data",
  "imported",
  "stathead-batting-situations.json"
);

function dedupePlayers(players: Player[]) {
  const seen = new Map<string, Player>();

  for (const player of players) {
    const existing = seen.get(player.id);
    if (!existing) {
      seen.set(player.id, player);
      continue;
    }

    seen.set(player.id, {
      ...existing,
      teams: [...new Set([...existing.teams, ...player.teams])],
      aliases: [...new Set([...existing.aliases, ...player.aliases])],
      debutYear: Math.min(existing.debutYear, player.debutYear),
      lastYear: Math.max(existing.lastYear, player.lastYear)
    });
  }

  return [...seen.values()];
}

function dedupeSeasons(seasons: PlayerSeason[]) {
  const seen = new Map<string, PlayerSeason>();

  for (const season of seasons) {
    seen.set(season.id, season);
  }

  return [...seen.values()];
}

function dedupeSituationSplits(splits: SituationSplit[]) {
  const seen = new Map<string, SituationSplit>();

  for (const split of splits) {
    seen.set(split.id, split);
  }

  return [...seen.values()];
}

export function getImportedDatasetPath() {
  return importedDatasetPath;
}

export function getImportedSituationDatasetPath() {
  return importedSituationDatasetPath;
}

export function readImportedDataset(): ImportedDataset | null {
  if (!fs.existsSync(importedDatasetPath)) {
    return null;
  }

  const raw = fs.readFileSync(importedDatasetPath, "utf8");
  const parsed = JSON.parse(raw) as ImportedDataset;

  return {
    ...parsed,
    players: dedupePlayers(parsed.players),
    seasons: dedupeSeasons(parsed.seasons)
  };
}

export function readImportedSituationDataset(): ImportedSituationDataset | null {
  if (!fs.existsSync(importedSituationDatasetPath)) {
    return null;
  }

  const raw = fs.readFileSync(importedSituationDatasetPath, "utf8");
  const parsed = JSON.parse(raw) as ImportedSituationDataset;

  return {
    ...parsed,
    players: dedupePlayers(parsed.players),
    splits: dedupeSituationSplits(parsed.splits)
  };
}
