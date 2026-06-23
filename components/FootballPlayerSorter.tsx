"use client";

import { useMemo, useState } from "react";

import { FantasyDraftRow, fantasyDraftRows } from "@/lib/data/fantasy-draft";
import { FantasySeasonRow, fantasySeasonRows } from "@/lib/data/fantasy-football";
import { PlayerMovement, movementRows } from "@/lib/data/fantasy-movement";

type FootballSorterCategory = "all" | "QB" | "RB" | "WR" | "TE";

type FootballSortState = {
  // IDs already placed into the user's current ordered ranking.
  rankingIds: string[];
  // IDs still waiting to be inserted into the ranking.
  pendingIds: string[];
  // Binary-search lower bound for where the current candidate belongs.
  low: number;
  // Binary-search upper bound for where the current candidate belongs.
  high: number;
  // Number of head-to-head choices the user has made.
  comparisons: number;
  // Kept for parity with the MLB sorter; NFL currently ranks the full selected pool.
  skippedCount: number;
};

type FootballSorterPlayer = {
  id: string;
  name: string;
  team: string;
  previousTeam: string;
  changedTeams: boolean;
  moveType?: PlayerMovement["moveType"];
  position: Exclude<FootballSorterCategory, "all">;
  fantasyPoints: number;
  draftScore: number;
  games: number;
  targets: number;
  yardsConsistency: number;
  defenseBoost: number;
  outperformance: number;
  summaryLine: string;
  statLine: string;
};

const categories: Array<{ id: FootballSorterCategory; label: string }> = [
  { id: "all", label: "All players" },
  { id: "QB", label: "Quarterbacks" },
  { id: "RB", label: "Running backs" },
  { id: "WR", label: "Wide receivers" },
  { id: "TE", label: "Tight ends" }
];

// How many depth-chart slots each NFL team contributes by position.
const depthChartSlotsByPosition: Record<Exclude<FootballSorterCategory, "all">, number> = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1
};

// Final target counts for the NFL sorter pool.
const depthChartPoolTargets: Record<Exclude<FootballSorterCategory, "all">, number> = {
  QB: 32,
  RB: 64,
  WR: 64,
  TE: 32
};

// Manual depth-chart overrides prevent a backup with more 2025 games/model points
// from replacing the real starter in the one-player-per-team QB pool.
const preferredDepthChartPlayers: Partial<
  Record<string, Partial<Record<Exclude<FootballSorterCategory, "all">, string[]>>>
> = {
  WAS: {
    QB: ["Jayden Daniels"]
  }
};

// Sports data exports use a few different abbreviations for the same NFL team.
const teamAliases: Record<string, string> = {
  GNB: "GB",
  KAN: "KC",
  LVR: "LV",
  NOR: "NO",
  NWE: "NE",
  SFO: "SF",
  TAM: "TB",
  WSH: "WAS"
};

// Player movement is keyed by normalized name so punctuation and suffixes do not break matches.
const playerMoves = new Map(
  movementRows
    .filter((row): row is PlayerMovement => row.type === "player")
    .map((row) => [normalizeName(row.name), row])
);

// Groups all season stat rows by player so stat-line formatting can quickly
// find a player's passing, rushing, or receiving totals.
const seasonRowsByPlayer = fantasySeasonRows.reduce((rowsByPlayer, row) => {
  const playerKey = normalizeName(row.player);
  const playerRows = rowsByPlayer.get(playerKey) ?? [];
  playerRows.push(row);
  rowsByPlayer.set(playerKey, playerRows);
  return rowsByPlayer;
}, new Map<string, FantasySeasonRow[]>());

// Normalizes names for fuzzy matching across data sources.
function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Converts data-source team abbreviations into the display abbreviation used by the app.
function displayTeam(team: string) {
  return teamAliases[team] ?? team;
}

// Shows team movement in a compact "old to new" form when a player changed teams.
function getTeamLabel(player: FootballSorterPlayer) {
  return player.changedTeams ? `${player.previousTeam} to ${player.team}` : player.team;
}

// Finds the most useful season row for a player and stat category. A 2TM row
// is preferred because it represents the player's full season across teams.
function getBestSeasonRow(playerName: string, category: FantasySeasonRow["category"]) {
  const playerRows = seasonRowsByPlayer.get(normalizeName(playerName)) ?? [];
  return playerRows
    .filter((row) => row.category === category)
    .sort((left, right) => {
      if (left.team === "2TM" && right.team !== "2TM") return -1;
      if (right.team === "2TM" && left.team !== "2TM") return 1;
      return right.fantasyPoints - left.fantasyPoints;
    })[0];
}

// Safely reads a numeric stat from an optional season row.
function getStatNumber(row: FantasySeasonRow | undefined, statName: string) {
  return Number(row?.stats[statName] ?? 0);
}

// Keeps stat display consistent across cards and table rows.
function formatDecimal(value: number, digits = 1) {
  return value.toFixed(digits);
}

// Builds the position-specific stat line shown on matchup cards and rankings.
function formatStatLine(row: FantasyDraftRow) {
  const games = Math.max(row.games, 1);
  const ppg = row.actualPoints / games;
  const passing = getBestSeasonRow(row.player, "passing");
  const rushing = getBestSeasonRow(row.player, "rushing");
  const receiving = getBestSeasonRow(row.player, "receiving");

  if (row.position === "QB") {
    return `${formatDecimal(ppg)} PPG | ${getStatNumber(passing, "passing_yards").toLocaleString()} yds | ${getStatNumber(passing, "passing_tds")} TD`;
  }

  if (row.position === "RB") {
    const rushingYards = getStatNumber(rushing, "rushing_yards");
    const receivingYards = getStatNumber(receiving, "receiving_yards");
    const touchdowns = getStatNumber(rushing, "rushing_tds") + getStatNumber(receiving, "receiving_tds");

    return `${formatDecimal(ppg)} PPG | ${formatDecimal(getStatNumber(rushing, "average"))} YPC | ${touchdowns} TD | ${(rushingYards + receivingYards).toLocaleString()} total yds`;
  }

  const receivingYards = getStatNumber(receiving, "receiving_yards");
  const ypg = receivingYards / games;

  return `${formatDecimal(ppg)} PPG | ${formatDecimal(ypg)} YPG | ${getStatNumber(receiving, "receptions")} rec | ${getStatNumber(receiving, "receiving_tds")} TD`;
}

// Converts a raw fantasy draft row into the smaller player object used by the sorter.
function normalizePlayer(row: FantasyDraftRow): FootballSorterPlayer | null {
  if (!["QB", "RB", "WR", "TE"].includes(row.position) || row.team === "2TM") {
    return null;
  }

  const move = playerMoves.get(normalizeName(row.player));
  const previousTeam = displayTeam(row.team);
  const currentTeam = move ? displayTeam(move.toTeam) : previousTeam;
  const statLine = formatStatLine(row);

  return {
    id: `${row.player}-${previousTeam}-${currentTeam}-${row.position}`,
    name: row.player,
    team: currentTeam,
    previousTeam,
    changedTeams: Boolean(move),
    moveType: move?.moveType,
    position: row.position as Exclude<FootballSorterCategory, "all">,
    fantasyPoints: row.actualPoints,
    draftScore: row.draftScore,
    games: row.games,
    targets: row.targets,
    yardsConsistency: row.yardConsistencyScore,
    defenseBoost: row.defenseBoost,
    outperformance: row.outperformance,
    summaryLine: statLine,
    statLine
  };
}

const footballPlayers = fantasyDraftRows
  .map(normalizePlayer)
  .filter((player): player is FootballSorterPlayer => Boolean(player));

function getDepthChartPriority(player: FootballSorterPlayer) {
  const preferredNames = preferredDepthChartPlayers[player.team]?.[player.position] ?? [];
  const preferredIndex = preferredNames.findIndex((name) => normalizeName(name) === normalizeName(player.name));
  return preferredIndex === -1 ? Number.POSITIVE_INFINITY : preferredIndex;
}

// Sorts players within a team/position depth chart using fantasy relevance.
function compareDepthChartValue(left: FootballSorterPlayer, right: FootballSorterPlayer) {
  return (
    getDepthChartPriority(left) - getDepthChartPriority(right) ||
    right.draftScore - left.draftScore ||
    right.fantasyPoints - left.fantasyPoints ||
    right.targets - left.targets ||
    right.games - left.games
  );
}

// Builds the fixed NFL sorter pool: one QB, two RBs, two WRs, and one TE per
// current team, then fills any shortfall with the next best players at that position.
function buildDepthChartPool(players: FootballSorterPlayer[]) {
  const selectedIds = new Set<string>();
  const selectedPlayers: FootballSorterPlayer[] = [];
  const teams = [...new Set(players.map((player) => player.team))].sort();
  const positions = ["QB", "RB", "WR", "TE"] as const;

  for (const position of positions) {
    for (const team of teams) {
      const teamPlayers = players
        .filter((player) => player.position === position && player.team === team)
        .sort(compareDepthChartValue)
        .slice(0, depthChartSlotsByPosition[position]);

      for (const player of teamPlayers) {
        if (!selectedIds.has(player.id)) {
          selectedIds.add(player.id);
          selectedPlayers.push(player);
        }
      }
    }

    const targetCount = depthChartPoolTargets[position];
    const currentCount = selectedPlayers.filter((player) => player.position === position).length;

    if (currentCount < targetCount) {
      const fillPlayers = players
        .filter((player) => player.position === position && !selectedIds.has(player.id))
        .sort(compareDepthChartValue)
        .slice(0, targetCount - currentCount);

      for (const player of fillPlayers) {
        selectedIds.add(player.id);
        selectedPlayers.push(player);
      }
    }
  }

  return selectedPlayers;
}

const footballDepthChartPlayers = buildDepthChartPool(footballPlayers);

// Returns the active NFL tab's player pool.
function getPlayersForCategory(category: FootballSorterCategory) {
  const pool =
    category === "all"
      ? footballDepthChartPlayers
      : footballDepthChartPlayers.filter((player) => player.position === category);

  return [...pool].sort((left, right) => right.draftScore - left.draftScore);
}

// Produces a repeatable shuffle so the same category starts in the same order.
function seededShuffle<T>(items: T[], seedKey: string) {
  let seed = [...seedKey].reduce((total, char) => total + char.charCodeAt(0), 0) || 17;
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

// Creates the first sort state by seeding the ranking with one player and
// leaving every other player as a pending candidate.
function initializeSort(players: FootballSorterPlayer[], category: FootballSorterCategory): FootballSortState {
  const ids = seededShuffle(
    players.map((player) => player.id),
    `${category}-${players.map((player) => player.id).join("-")}`
  );

  return {
    rankingIds: ids.slice(0, 1),
    pendingIds: ids.slice(1),
    low: 0,
    high: ids.length > 1 ? 1 : 0,
    comparisons: 0,
    skippedCount: 0
  };
}

// Places the current pending candidate into the ranking once binary search
// has found the correct insertion point.
function insertCandidate(state: FootballSortState, insertIndex: number): FootballSortState {
  const [candidateId, ...remainingIds] = state.pendingIds;
  const rankingIds = [...state.rankingIds];
  rankingIds.splice(insertIndex, 0, candidateId);

  return {
    rankingIds,
    pendingIds: remainingIds,
    low: 0,
    high: remainingIds.length ? rankingIds.length : 0,
    comparisons: state.comparisons + 1,
    skippedCount: state.skippedCount
  };
}

// Applies a single head-to-head choice and narrows the current candidate's
// insertion range until the player can be placed.
function recordChoice(state: FootballSortState, winnerId: string, opponentId: string): FootballSortState {
  const candidateId = state.pendingIds[0];
  const midpoint = Math.floor((state.low + state.high) / 2);
  const low = winnerId === opponentId ? midpoint + 1 : state.low;
  const high = winnerId === candidateId ? midpoint : state.high;

  if (low >= high) {
    return insertCandidate({ ...state, low, high }, low);
  }

  return {
    ...state,
    low,
    high,
    comparisons: state.comparisons + 1,
    skippedCount: state.skippedCount
  };
}

// FootballChoice is one clickable matchup card in the head-to-head sorter.
function FootballChoice({ player, onChoose }: { player: FootballSorterPlayer; onChoose: () => void }) {
  return (
    <button className="sorter-choice football-choice" onClick={onChoose} type="button">
      <span className="football-avatar">{player.position}</span>
      <span className="sorter-name">{player.name}</span>
      <span className="sorter-meta">
        {getTeamLabel(player)} · {player.position}
      </span>
      <span className="sorter-note">{player.summaryLine}</span>
    </button>
  );
}

// Escapes one value for CSV output.
function csvCell(value: string | number | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

// Creates and clicks a temporary browser download link for the final CSV.
function downloadCsv(filename: string, rows: Array<Array<string | number | undefined>>) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// FootballPlayerSorter owns the NFL ranking flow: active tab, depth-chart pool,
// sort state, undo history, matchup rendering, live leaderboard, and CSV export.
export function FootballPlayerSorter() {
  const [category, setCategory] = useState<FootballSorterCategory>("all");
  const selectedPlayers = useMemo(() => getPlayersForCategory(category), [category]);
  const playersById = useMemo(
    () => new Map(selectedPlayers.map((player) => [player.id, player])),
    [selectedPlayers]
  );
  const [sortState, setSortState] = useState(() => initializeSort(selectedPlayers, category));
  const [history, setHistory] = useState<FootballSortState[]>([]);

  // Convert ID-based state back into player objects for rendering.
  const rankedPlayers = sortState.rankingIds
    .map((playerId) => playersById.get(playerId))
    .filter((player): player is FootballSorterPlayer => Boolean(player));
  const candidateId = sortState.pendingIds[0];
  const opponentId =
    candidateId && sortState.rankingIds.length
      ? sortState.rankingIds[Math.floor((sortState.low + sortState.high) / 2)]
      : undefined;
  const leftPlayer = candidateId ? playersById.get(candidateId) : undefined;
  const rightPlayer = opponentId ? playersById.get(opponentId) : undefined;
  const complete = !candidateId;
  const reviewedCount = rankedPlayers.length + sortState.skippedCount;
  const progress = selectedPlayers.length ? Math.round((reviewedCount / selectedPlayers.length) * 100) : 0;
  const rankingGoal = selectedPlayers.length;

  // Switching tabs starts a fresh ranking for the newly selected pool.
  function chooseCategory(nextCategory: FootballSorterCategory) {
    const nextPlayers = getPlayersForCategory(nextCategory);
    setCategory(nextCategory);
    setSortState(initializeSort(nextPlayers, nextCategory));
    setHistory([]);
  }

  // Saves the current state for Undo, then records the user's matchup winner.
  function chooseWinner(winnerId: string) {
    if (!opponentId || !candidateId) {
      return;
    }

    setHistory((currentHistory) => [...currentHistory, sortState]);
    setSortState((currentState) => recordChoice(currentState, winnerId, opponentId));
  }

  // Downloads the completed NFL ranking as a CSV file.
  function saveFinalList() {
    if (!complete) {
      return;
    }

    const categoryLabel = categories.find((option) => option.id === category)?.label ?? "Ranking";
    const rows: Array<Array<string | number | undefined>> = [
      ["Rank", "Player", "Team", "Position", "Stats"],
      ...rankedPlayers.map((player, index) => [
        index + 1,
        player.name,
        getTeamLabel(player),
        player.position,
        player.statLine
      ])
    ];

    downloadCsv(`nfl-${categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-ranking.csv`, rows);
  }

  return (
    <main className="site-shell">
      <section className="sorter-setup">
        <h1>NFL PLAYER SORTER</h1>
        <div className="sorter-tabs" role="list">
          {categories.map((option) => (
            <button
              className={option.id === category ? "sorter-tab active" : "sorter-tab"}
              key={option.id}
              onClick={() => chooseCategory(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="sorter-board">
        <div className="sorter-status">
          <div>
            <strong>
              {reviewedCount} / {selectedPlayers.length}
            </strong>
            <span className="muted">players reviewed</span>
          </div>
          <div>
            <strong>
              {rankedPlayers.length} / {rankingGoal}
            </strong>
            <span className="muted">ranking spots</span>
          </div>
          <div>
            <strong>{sortState.comparisons}</strong>
            <span className="muted">choices made</span>
          </div>
        </div>

        <div className="sorter-progress" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        {complete ? (
          <div className="sorter-complete">
            <p className="eyebrow">Ranking ready</p>
            <h2>{categories.find((option) => option.id === category)?.label} results</h2>
            <p className="muted">
              {category === "all"
                ? "Your full football ranking has been built from the depth chart player pool."
                : "Every player in this position pool has been placed into your ranking."}
            </p>
          </div>
        ) : leftPlayer && rightPlayer ? (
          <div className="sorter-matchup">
            <FootballChoice onChoose={() => chooseWinner(leftPlayer.id)} player={leftPlayer} />
            <div className="versus">VS</div>
            <FootballChoice onChoose={() => chooseWinner(rightPlayer.id)} player={rightPlayer} />
          </div>
        ) : null}

        <div className="button-row sorter-actions">
          <button
            className="ghost-button"
            disabled={!history.length}
            onClick={() => {
              const previous = history.at(-1);
              if (!previous) {
                return;
              }
              setSortState(previous);
              setHistory((currentHistory) => currentHistory.slice(0, -1));
            }}
            type="button"
          >
            Undo
          </button>
          <button
            className="ghost-button"
            disabled={!history.length && sortState.comparisons === 0}
            onClick={() => {
              setSortState(initializeSort(selectedPlayers, category));
              setHistory([]);
            }}
            type="button"
          >
            Reset this ranking
          </button>
          <button className="ghost-button" disabled={!complete} onClick={saveFinalList} type="button">
            Save final list
          </button>
        </div>
      </section>

      <section className="sorter-results">
        <div className="compare-headline">
          <p className="eyebrow">Live leaderboard</p>
          <h2>Your ranking</h2>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Team</th>
                <th>Pos</th>
                <th>Stats</th>
              </tr>
            </thead>
            <tbody>
              {rankedPlayers.map((player, index) => (
                <tr key={player.id}>
                  <td className="cell-strong">#{index + 1}</td>
                  <td>{player.name}</td>
                  <td>
                    {getTeamLabel(player)}
                    {player.moveType ? <span className="table-subtle"> {player.moveType}</span> : null}
                  </td>
                  <td>{player.position}</td>
                  <td>{player.statLine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
