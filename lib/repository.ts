import { players } from "@/lib/data/players";
import { seasons } from "@/lib/data/seasons";
import { situationSplits } from "@/lib/data/situations";
import { readImportedDataset, readImportedSituationDataset } from "@/lib/imported-data";
import { metricCatalog } from "@/lib/metrics";
import {
  CareerAggregate,
  Player,
  PlayerRole,
  PlayerSeason,
  SituationFilter,
  SituationSplit
} from "@/lib/types";

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return sum(values) / values.length;
}

function getAllPlayers() {
  const imported = readImportedDataset();
  const importedSituations = readImportedSituationDataset();
  if (!imported && !importedSituations) {
    return players;
  }

  const merged = new Map<string, Player>();
  for (const player of [
    ...players,
    ...(imported?.players ?? []),
    ...(importedSituations?.players ?? [])
  ]) {
    const existing = merged.get(player.id);
    if (!existing) {
      merged.set(player.id, player);
      continue;
    }

    merged.set(player.id, {
      ...existing,
      ...player,
      teams: [...new Set([...existing.teams, ...player.teams])],
      aliases: [...new Set([...existing.aliases, ...player.aliases])],
      debutYear: Math.min(existing.debutYear, player.debutYear),
      lastYear: Math.max(existing.lastYear, player.lastYear)
    });
  }

  return [...merged.values()];
}

function getAllSeasons() {
  const imported = readImportedDataset();
  if (!imported) {
    return seasons;
  }

  const merged = new Map<string, PlayerSeason>();
  for (const season of [...seasons, ...imported.seasons]) {
    merged.set(season.id, season);
  }

  return [...merged.values()];
}

function getAllSituationSplits() {
  const imported = readImportedSituationDataset();
  if (!imported) {
    return situationSplits;
  }

  const merged = new Map<string, SituationSplit>();
  for (const split of [...situationSplits, ...imported.splits]) {
    merged.set(split.id, split);
  }

  return [...merged.values()];
}

function deriveCareerAggregate(playerId: string, role: "hitter" | "pitcher"): CareerAggregate {
  const rows = getAllSeasons().filter((season) => season.playerId === playerId && season.role === role);
  const stats = Object.fromEntries(
    metricCatalog
      .filter((metric) => metric.roleScope === "both" || metric.roleScope === role)
      .map((metric) => {
        const values = rows
          .map((row) => row.stats[metric.id])
          .filter((value): value is number => typeof value === "number");
        const totalLike = ["war", "hr", "ip", "so"].includes(metric.id);
        return [metric.id, totalLike ? Number(sum(values).toFixed(1)) : Number(average(values).toFixed(3))];
      })
  );

  const peakYear = rows
    .slice()
    .sort((left, right) => (right.stats.war ?? 0) - (left.stats.war ?? 0))
    .slice(0, 2);

  const peakStats = Object.fromEntries(
    Object.keys(stats).map((metricId) => {
      const values = peakYear
        .map((row) => row.stats[metricId])
        .filter((value): value is number => typeof value === "number");
      const totalLike = ["war", "hr", "ip", "so"].includes(metricId);
      return [metricId, totalLike ? Number(sum(values).toFixed(1)) : Number(average(values).toFixed(3))];
    })
  );

  return {
    playerId,
    role,
    stats,
    peakWindow: {
      label: "Best two-season window",
      years: peakYear.map((row) => row.season).sort(),
      stats: peakStats
    }
  };
}

export function getPlayers() {
  return getAllPlayers();
}

export function getPlayerById(playerId: string) {
  return getAllPlayers().find((player) => player.id === playerId);
}

export function searchPlayers(query: string, role?: PlayerRole) {
  const normalized = query.trim().toLowerCase();
  return getAllPlayers()
    .filter((player) => {
      if (role && player.primaryRole !== "two-way" && player.primaryRole !== role) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return (
        player.fullName.toLowerCase().includes(normalized) ||
        player.aliases.some((alias) => alias.toLowerCase().includes(normalized))
      );
    })
    .slice(0, 12);
}

export function getSeasonsForPlayer(playerId: string, role?: "hitter" | "pitcher", startYear?: number, endYear?: number) {
  return getAllSeasons().filter((season) => {
    if (season.playerId !== playerId) {
      return false;
    }
    if (role && season.role !== role) {
      return false;
    }
    if (startYear && season.season < startYear) {
      return false;
    }
    if (endYear && season.season > endYear) {
      return false;
    }
    return true;
  });
}

function matchesSituationFilter(split: SituationSplit, filter: SituationFilter) {
  if (filter.inningMin && split.filter.inningMin !== filter.inningMin) {
    return false;
  }
  if (filter.inningMax && split.filter.inningMax !== filter.inningMax) {
    return false;
  }
  if (filter.maxRunMargin && split.filter.maxRunMargin !== filter.maxRunMargin) {
    return false;
  }
  return true;
}

export function getSituationSplitsForPlayer(
  playerId: string,
  role: "hitter" | "pitcher",
  filter: SituationFilter,
  startYear?: number,
  endYear?: number
) {
  return getAllSituationSplits().filter((split) => {
    if (split.playerId !== playerId || split.role !== role) {
      return false;
    }
    if (startYear && split.season < startYear) {
      return false;
    }
    if (endYear && split.season > endYear) {
      return false;
    }
    return matchesSituationFilter(split, filter);
  });
}

export function inferRoleForPlayers(playerIds: string[]): "hitter" | "pitcher" {
  const resolved = playerIds
    .map((playerId) => getPlayerById(playerId))
    .filter((player): player is Player => Boolean(player));

  const hasPitchers = resolved.some((player) => player.primaryRole === "pitcher");
  return hasPitchers ? "pitcher" : "hitter";
}

export function getCareerAggregate(playerId: string, role: "hitter" | "pitcher") {
  return deriveCareerAggregate(playerId, role);
}

export function getAllCareerAggregates(role: "hitter" | "pitcher") {
  return getAllPlayers()
    .filter((player) => player.primaryRole === role || player.primaryRole === "two-way")
    .map((player) => deriveCareerAggregate(player.id, role));
}

export function getPlayerSummary(playerId: string) {
  const player = getPlayerById(playerId);
  if (!player) {
    return null;
  }

  const hitterRows = getSeasonsForPlayer(playerId, "hitter");
  const pitcherRows = getSeasonsForPlayer(playerId, "pitcher");

  return {
    player,
    availableRoles: [hitterRows.length ? "hitter" : null, pitcherRows.length ? "pitcher" : null].filter(
      (role): role is "hitter" | "pitcher" => Boolean(role)
    ),
    hitter: hitterRows.length ? getCareerAggregate(playerId, "hitter") : null,
    pitcher: pitcherRows.length ? getCareerAggregate(playerId, "pitcher") : null,
    recentSeasons: [...hitterRows, ...pitcherRows].sort((left, right) => right.season - left.season).slice(0, 6)
  };
}

export function getAvailableYears(role: "hitter" | "pitcher") {
  const years = getAllSeasons()
    .filter((season) => season.role === role)
    .map((season) => season.season);

  return {
    min: Math.min(...years),
    max: Math.max(...years)
  };
}

export function formatSituationLabel(filter?: SituationFilter) {
  if (!filter || (!filter.inningMin && !filter.inningMax && !filter.maxRunMargin)) {
    return undefined;
  }

  const parts: string[] = [];
  if (filter.inningMin) {
    parts.push(`after the ${filter.inningMin}${filter.inningMin === 1 ? "st" : filter.inningMin === 2 ? "nd" : filter.inningMin === 3 ? "rd" : "th"} inning`);
  }
  if (filter.inningMax) {
    parts.push(`through inning ${filter.inningMax}`);
  }
  if (filter.maxRunMargin) {
    parts.push(`within ${filter.maxRunMargin} runs`);
  }

  if (!parts.length) {
    return undefined;
  }

  return parts.join(", ");
}

export function getSourceLabelsForSeason(season: PlayerSeason) {
  return Object.entries(season.sourceMap).map(([metric, source]) => ({ metric, source }));
}
