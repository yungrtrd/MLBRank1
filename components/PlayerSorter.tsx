"use client";

import { useMemo, useState } from "react";

import { SorterPlayer, SorterPosition, sorterPlayers } from "@/lib/data/sorter-players";

type SorterCategory = "all" | "position-players" | "pitchers" | SorterPosition;

type SortState = {
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
  // Players skipped because they could not enter a capped ranking, such as the top 100 list.
  skippedCount: number;
};

// Tabs shown at the top of the MLB sorter.
const categories: Array<{ id: SorterCategory; label: string }> = [
  { id: "all", label: "All players" },
  { id: "position-players", label: "All position players" },
  { id: "pitchers", label: "All pitchers" },
  { id: "C", label: "Catchers" },
  { id: "1B", label: "First base" },
  { id: "2B", label: "Second base" },
  { id: "3B", label: "Third base" },
  { id: "SS", label: "Shortstop" },
  { id: "LF", label: "Left field" },
  { id: "CF", label: "Center field" },
  { id: "RF", label: "Right field" },
  { id: "DH", label: "Designated hitters" },
  { id: "SP", label: "Starting pitchers" },
  { id: "CP", label: "Closers" }
];

const pitcherPositions = new Set<SorterPosition>(["SP", "CP"]);
const allPlayersPoolSize = 200;
const allPlayersRankingSize = 100;

// Builds the player pool for the active MLB category.
function getPlayersForCategory(category: SorterCategory) {
  if (category === "all") {
    return [...sorterPlayers].sort((left, right) => (right.war ?? 0) - (left.war ?? 0)).slice(0, allPlayersPoolSize);
  }

  if (category === "position-players") {
    return sorterPlayers.filter((player) => !pitcherPositions.has(player.position));
  }

  if (category === "pitchers") {
    return sorterPlayers.filter((player) => pitcherPositions.has(player.position));
  }

  return sorterPlayers.filter((player) => player.position === category);
}

// Only the all-player MLB mode ranks a top 100 from a larger top-200 pool.
function getRankingLimit(category: SorterCategory) {
  return category === "all" ? allPlayersRankingSize : undefined;
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
function initializeSort(players: SorterPlayer[], category: SorterCategory): SortState {
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
function insertCandidate(state: SortState, insertIndex: number, rankingLimit?: number): SortState {
  const [candidateId, ...remainingIds] = state.pendingIds;
  const candidateMissedCut = typeof rankingLimit === "number" && insertIndex >= rankingLimit;

  if (candidateMissedCut) {
    return {
      rankingIds: state.rankingIds,
      pendingIds: remainingIds,
      low: 0,
      high: remainingIds.length ? state.rankingIds.length : 0,
      comparisons: state.comparisons + 1,
      skippedCount: state.skippedCount + 1
    };
  }

  const rankingIds = [...state.rankingIds];
  rankingIds.splice(insertIndex, 0, candidateId);
  const cappedRankingIds = typeof rankingLimit === "number" ? rankingIds.slice(0, rankingLimit) : rankingIds;
  const trimmedCount = rankingIds.length - cappedRankingIds.length;

  return {
    rankingIds: cappedRankingIds,
    pendingIds: remainingIds,
    low: 0,
    high: remainingIds.length ? cappedRankingIds.length : 0,
    comparisons: state.comparisons + 1,
    skippedCount: state.skippedCount + trimmedCount
  };
}

// Applies a single head-to-head choice. The candidate is either moved above or
// below the opponent, narrowing the binary-search range until insertion happens.
function recordChoice(state: SortState, winnerId: string, opponentId: string, rankingLimit?: number): SortState {
  const candidateId = state.pendingIds[0];
  const midpoint = Math.floor((state.low + state.high) / 2);
  const low = winnerId === opponentId ? midpoint + 1 : state.low;
  const high = winnerId === candidateId ? midpoint : state.high;

  if (low >= high) {
    return insertCandidate({ ...state, low, high }, low, rankingLimit);
  }

  return {
    ...state,
    low,
    high,
    comparisons: state.comparisons + 1,
    skippedCount: state.skippedCount
  };
}

// PlayerChoice is one clickable matchup card in the head-to-head sorter.
function PlayerChoice({ player, onChoose }: { player: SorterPlayer; onChoose: () => void }) {
  return (
    <button className="sorter-choice" onClick={onChoose} type="button">
      <span className="sorter-photo-wrap">
        <img alt={`${player.name} headshot`} className="sorter-photo" src={player.imageUrl} />
      </span>
      <span className="sorter-name">{player.name}</span>
      <span className="sorter-meta">
        {player.team} · {player.position}
      </span>
      <span className="sorter-note">{player.slashLine}</span>
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

// PlayerSorter owns the MLB ranking flow: active tab, sort state, undo history,
// matchup rendering, live leaderboard, and final CSV export.
export function PlayerSorter() {
  const [category, setCategory] = useState<SorterCategory>("all");
  const selectedPlayers = useMemo(() => getPlayersForCategory(category), [category]);
  const playersById = useMemo(
    () => new Map(selectedPlayers.map((player) => [player.id, player])),
    [selectedPlayers]
  );
  const [sortState, setSortState] = useState(() => initializeSort(selectedPlayers, category));
  const [history, setHistory] = useState<SortState[]>([]);
  const rankingLimit = getRankingLimit(category);

  // Convert ID-based state back into player objects for rendering.
  const rankedPlayers = sortState.rankingIds
    .map((playerId) => playersById.get(playerId))
    .filter((player): player is SorterPlayer => Boolean(player));
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
  const showInningsPitched = selectedPlayers.some((player) => pitcherPositions.has(player.position));
  const rankingGoal = rankingLimit ?? selectedPlayers.length;

  // Switching tabs starts a fresh ranking for the newly selected pool.
  function chooseCategory(nextCategory: SorterCategory) {
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
    setSortState((currentState) => recordChoice(currentState, winnerId, opponentId, rankingLimit));
  }

  // Downloads the completed MLB ranking as a CSV file.
  function saveFinalList() {
    if (!complete) {
      return;
    }

    const categoryLabel = categories.find((option) => option.id === category)?.label ?? "Ranking";
    const rows: Array<Array<string | number | undefined>> = [
      ["Rank", "Player", "Team", "Position", "Slash line", "WAR", "IP"],
      ...rankedPlayers.map((player, index) => [
        index + 1,
        player.name,
        player.team,
        player.position,
        player.slashLine,
        player.war?.toFixed(1),
        player.inningsPitched
      ])
    ];

    downloadCsv(`mlb-${categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-ranking.csv`, rows);
  }

  return (
    <main className="site-shell">
      <section className="sorter-setup">
        <h1>MLB RANKING</h1>
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
                ? "Your top 100 has been built from the top 200 players by WAR."
                : "Every player in this pool has been placed into your ranking."}
            </p>
          </div>
        ) : leftPlayer && rightPlayer ? (
          <div className="sorter-matchup">
            <PlayerChoice onChoose={() => chooseWinner(leftPlayer.id)} player={leftPlayer} />
            <div className="versus">VS</div>
            <PlayerChoice onChoose={() => chooseWinner(rightPlayer.id)} player={rightPlayer} />
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
                <th>Slash line</th>
                <th>Position</th>
                <th>WAR</th>
                {showInningsPitched ? <th>IP</th> : null}
              </tr>
            </thead>
            <tbody>
              {rankedPlayers.map((player, index) => (
                <tr key={player.id}>
                  <td className="cell-strong">#{index + 1}</td>
                  <td>
                    <div className="sorter-table-player">
                      <img alt="" src={player.imageUrl} />
                      <span>
                        <strong>{player.name}</strong>
                        <small>{player.team}</small>
                      </span>
                    </div>
                  </td>
                  <td>{player.slashLine}</td>
                  <td>{player.position}</td>
                  <td>{player.war?.toFixed(1) ?? "-"}</td>
                  {showInningsPitched ? <td>{player.inningsPitched ?? "-"}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
