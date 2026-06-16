import Link from "next/link";

import { buildCompareHref, ComparePageState } from "@/lib/query-state";
import { CompareResponse, MetricDefinition } from "@/lib/types";

function formatValue(value: number | null, metric: MetricDefinition) {
  if (value === null) {
    return "—";
  }

  switch (metric.format) {
    case "integer":
      return value.toFixed(0);
    case "decimal":
    case "era":
      return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
    case "innings":
      return value.toFixed(1);
    case "percentage":
      return `${(value * 100).toFixed(1)}%`;
    default:
      return String(value);
  }
}

type ComparisonTableProps = {
  response: CompareResponse;
  state: ComparePageState;
};

type SeasonAlignmentRow = {
  index: number;
  players: Array<{
    playerId: string;
    playerName: string;
    label: string | null;
    stats: Record<string, number | null>;
  }>;
};

type CareerRow = {
  playerId: string;
  playerName: string;
  label: string;
  stats: Record<string, number | null>;
};

function buildSeasonAlignmentRows(response: CompareResponse, state: ComparePageState): SeasonAlignmentRow[] {
  const longest = Math.max(...response.players.map((player) => player.rows.length), 0);

  const rows = Array.from({ length: longest }, (_, index) => ({
    index,
    players: response.players.map((player) => {
      const row = player.rows[index];
      return {
        playerId: player.player.id,
        playerName: player.player.fullName,
        label: row?.label ?? null,
        stats: Object.fromEntries(
          response.metrics.map((metric) => [metric.id, row?.stats[metric.id] ?? null])
        )
      };
    })
  }));

  const sortBy = state.sortBy;
  if (!sortBy || sortBy === "slot") {
    return state.sortDirection === "desc" ? rows.slice().reverse() : rows;
  }

  const direction = state.sortDirection === "asc" ? 1 : -1;
  const [playerId, field] = sortBy.split(":");
  if (!playerId || !field) {
    if (response.metrics.some((metric) => metric.id === sortBy)) {
      return rows.slice().sort((left, right) => {
        const leftValues = left.players
          .map((player) => player.stats[sortBy])
          .filter((value): value is number => value !== null);
        const rightValues = right.players
          .map((player) => player.stats[sortBy])
          .filter((value): value is number => value !== null);

        const leftValue = leftValues.length
          ? leftValues.reduce((sum, value) => sum + value, 0) / leftValues.length
          : Number.NEGATIVE_INFINITY;
        const rightValue = rightValues.length
          ? rightValues.reduce((sum, value) => sum + value, 0) / rightValues.length
          : Number.NEGATIVE_INFINITY;

        return (leftValue - rightValue) * direction;
      });
    }

    return rows;
  }

  return rows.slice().sort((left, right) => {
    const leftPlayer = left.players.find((player) => player.playerId === playerId);
    const rightPlayer = right.players.find((player) => player.playerId === playerId);

    if (!leftPlayer || !rightPlayer) {
      return 0;
    }

    if (field === "season") {
      const leftLabel = leftPlayer.label ?? "";
      const rightLabel = rightPlayer.label ?? "";
      return leftLabel.localeCompare(rightLabel) * direction;
    }

    const leftValue = leftPlayer.stats[field] ?? Number.NEGATIVE_INFINITY;
    const rightValue = rightPlayer.stats[field] ?? Number.NEGATIVE_INFINITY;
    return (leftValue - rightValue) * direction;
  });
}

function buildCareerRows(response: CompareResponse, state: ComparePageState): CareerRow[] {
  const rows = response.players.flatMap((entry) =>
    entry.rows.map((row) => ({
      playerId: entry.player.id,
      playerName: entry.player.fullName,
      label: row.label,
      stats: row.stats
    }))
  );

  const direction = state.sortDirection === "asc" ? 1 : -1;
  const sortBy = state.sortBy ?? response.metrics[0]?.id ?? "player";

  return rows.sort((left, right) => {
    if (sortBy === "player") {
      return left.playerName.localeCompare(right.playerName) * direction;
    }
    if (sortBy === "label") {
      return left.label.localeCompare(right.label) * direction;
    }
    const leftValue = left.stats[sortBy] ?? Number.NEGATIVE_INFINITY;
    const rightValue = right.stats[sortBy] ?? Number.NEGATIVE_INFINITY;
    return (leftValue - rightValue) * direction;
  });
}

function buildSortHref(
  state: ComparePageState,
  nextSortBy: string,
  defaultDirection: "asc" | "desc" = "asc"
) {
  const nextDirection =
    state.sortBy === nextSortBy
      ? state.sortDirection === "desc"
        ? "asc"
        : "desc"
      : defaultDirection;
  return buildCompareHref({
    ...state,
    sortBy: nextSortBy,
    sortDirection: nextDirection
  });
}

function buildSeasonSortHref(state: ComparePageState, playerId: string, field: string) {
  const nextSortBy = `${playerId}:${field}`;
  return buildSortHref(state, nextSortBy, field === "season" ? "asc" : "desc");
}

function SeasonComparisonTable({
  response,
  state
}: {
  response: CompareResponse;
  state: ComparePageState;
}) {
  const rows = buildSeasonAlignmentRows(response, state);

  return (
    <section className="table-card">
      <h2>Season-by-Season Head-to-Head</h2>
      <p>
        Seasons are aligned by each player&apos;s career order, starting with rookie year, so the first row compares
        rookie seasons side by side.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>
                <Link href={buildSortHref(state, "slot")}>Career Year</Link>
              </th>
              {response.players.map((player) => (
                <th className="player-group-heading" colSpan={response.metrics.length + 1} key={player.player.id}>
                  {player.player.fullName}
                </th>
              ))}
            </tr>
            <tr>
              <th>Slot</th>
              {response.players.map((player) => (
                <th colSpan={response.metrics.length + 1} key={`${player.player.id}-subhead`}>
                  <div className="comparison-subhead">
                    <span className="cell-muted">{player.player.primaryRole}</span>
                    <span className="cell-muted">
                      {player.player.debutYear}-{player.player.lastYear}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              <th>
                <Link href={buildSortHref(state, "slot")}>Year #</Link>
              </th>
              {response.players.flatMap((player) => [
                <th key={`${player.player.id}-season-label`}>
                  <Link href={buildSeasonSortHref(state, player.player.id, "season")}>Season</Link>
                </th>,
                ...response.metrics.map((metric) => (
                  <th key={`${player.player.id}-${metric.id}`}>
                    <Link href={buildSortHref(state, metric.id, "desc")}>{metric.label}</Link>
                  </th>
                ))
              ])}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`aligned-${row.index}`}>
                <td className="cell-strong">{row.index + 1}</td>
                {row.players.flatMap((player) => [
                  <td className="cell-muted" key={`${player.playerId}-label-${row.index}`}>
                    {player.label ?? "—"}
                  </td>,
                  ...response.metrics.map((metric) => (
                    <td key={`${player.playerId}-${metric.id}-${row.index}`}>
                      {formatValue(player.stats[metric.id] ?? null, metric)}
                    </td>
                  ))
                ])}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CareerComparisonTable({
  response,
  state
}: {
  response: CompareResponse;
  state: ComparePageState;
}) {
  const rows = buildCareerRows(response, state);

  return (
    <section className="table-card">
      <h2>Career Snapshot</h2>
      <p>
        Metrics shown are role-aware for <strong>{response.role}</strong> comparisons only.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>
                <Link href={buildSortHref(state, "player")}>Player</Link>
              </th>
              <th>
                <Link href={buildSortHref(state, "label")}>Row</Link>
              </th>
              {response.metrics.map((metric) => (
                <th key={metric.id}>
                  <Link href={buildSortHref(state, metric.id)}>{metric.label}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.playerId}-${row.label}`}>
                <td className="cell-strong">{row.playerName}</td>
                <td className="cell-muted">{row.label}</td>
                {response.metrics.map((metric) => (
                  <td key={metric.id}>{formatValue(row.stats[metric.id] ?? null, metric)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ComparisonTable({ response, state }: ComparisonTableProps) {
  if (response.mode === "season") {
    return <SeasonComparisonTable response={response} state={state} />;
  }

  return <CareerComparisonTable response={response} state={state} />;
}
