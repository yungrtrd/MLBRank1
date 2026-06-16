import { getMetricsForRole } from "@/lib/metrics";
import {
  formatSituationLabel,
  getCareerAggregate,
  getPlayerById,
  getSeasonsForPlayer,
  getSituationSplitsForPlayer,
  inferRoleForPlayers
} from "@/lib/repository";
import { CompareRequest, CompareResponse, PlayerSeason, SituationSplit } from "@/lib/types";

function toSeasonRow(season: PlayerSeason, metricIds: string[]) {
  return {
    label: `${season.season} ${season.team}`,
    season: season.season,
    stats: Object.fromEntries(metricIds.map((metricId) => [metricId, season.stats[metricId] ?? null]))
  };
}

function toSituationRow(split: SituationSplit, metricIds: string[]) {
  return {
    label: `${split.season} ${split.label} (${split.sampleSizeLabel})`,
    season: split.season,
    stats: Object.fromEntries(metricIds.map((metricId) => [metricId, split.stats[metricId] ?? null]))
  };
}

function buildAggregateRowsFromSituations(splits: SituationSplit[], metricIds: string[]) {
  const stats = Object.fromEntries(
    metricIds.map((metricId) => {
      const values = splits.map((split) => split.stats[metricId]).filter((value): value is number => typeof value === "number");
      const totalLike = ["war", "hr", "ip", "so"].includes(metricId);
      const value = totalLike
        ? values.reduce((sum, item) => sum + item, 0)
        : values.length
          ? values.reduce((sum, item) => sum + item, 0) / values.length
          : null;
      return [metricId, value === null ? null : Number(value.toFixed(3))];
    })
  );

  const bestYears = splits
    .slice()
    .sort((left, right) => (right.stats.war ?? 0) - (left.stats.war ?? 0))
    .slice(0, 2);

  const peakStats = Object.fromEntries(
    metricIds.map((metricId) => {
      const values = bestYears.map((split) => split.stats[metricId]).filter((value): value is number => typeof value === "number");
      const totalLike = ["war", "hr", "ip", "so"].includes(metricId);
      const value = totalLike
        ? values.reduce((sum, item) => sum + item, 0)
        : values.length
          ? values.reduce((sum, item) => sum + item, 0) / values.length
          : null;
      return [metricId, value === null ? null : Number(value.toFixed(3))];
    })
  );

  return [
    {
      label: "Situation aggregate",
      stats
    },
    {
      label: "Best two-season situation window",
      stats: peakStats
    }
  ];
}

export function buildComparison(request: CompareRequest): CompareResponse {
  const role = request.role ?? inferRoleForPlayers(request.playerIds);
  const metrics = getMetricsForRole(role, request.metrics);
  const metricIds = metrics.map((metric) => metric.id);
  const hasSituation = Boolean(
    request.situation && (request.situation.inningMin || request.situation.inningMax || request.situation.maxRunMargin)
  );
  const situationLabel = formatSituationLabel(request.situation);

  const players = request.playerIds.map((playerId) => {
    const player = getPlayerById(playerId);
    if (!player) {
      throw new Error(`Unknown player: ${playerId}`);
    }

    const seasonRows = getSeasonsForPlayer(playerId, role, request.startYear, request.endYear).sort(
      (left, right) => left.season - right.season
    );
    const situationRows = hasSituation
      ? getSituationSplitsForPlayer(playerId, role, request.situation ?? {}, request.startYear, request.endYear).sort(
          (left, right) => left.season - right.season
        )
      : [];

    const summary = getCareerAggregate(playerId, role);
    const rows =
      request.mode === "career"
        ? hasSituation
          ? buildAggregateRowsFromSituations(situationRows, metricIds)
          : [
              {
                label: "Career",
                stats: Object.fromEntries(metricIds.map((metricId) => [metricId, summary.stats[metricId] ?? null]))
              },
              {
                label: summary.peakWindow.label,
                stats: Object.fromEntries(
                  metricIds.map((metricId) => [metricId, summary.peakWindow.stats[metricId] ?? null])
                )
              }
            ]
        : hasSituation
          ? situationRows.map((split) => toSituationRow(split, metricIds))
          : seasonRows.map((season) => toSeasonRow(season, metricIds));

    const series = Object.fromEntries(
      metricIds.map((metricId) => [
        metricId,
        (hasSituation ? situationRows : seasonRows).map((row) => ({
          season: row.season,
          value: row.stats[metricId] ?? null
        }))
      ])
    );

    return {
      player,
      rows,
      summary,
      series
    };
  });

  return {
    mode: request.mode,
    role,
    scope: hasSituation ? "situation" : "overall",
    situationLabel,
    metrics,
    players
  };
}

export function toCsv(response: CompareResponse) {
  const header = ["player", "label", ...response.metrics.map((metric) => metric.label)];
  const lines = [header.join(",")];

  for (const player of response.players) {
    for (const row of player.rows) {
      const values = [
        player.player.fullName,
        row.label,
        ...response.metrics.map((metric) => String(row.stats[metric.id] ?? ""))
      ];
      lines.push(values.join(","));
    }
  }

  return lines.join("\n");
}
