"use client";

import { useMemo, useState } from "react";

import { SorterPlayer, SorterPosition, sorterPlayers } from "@/lib/data/sorter-players";

type SorterCategory = "all" | "position-players" | "pitchers" | SorterPosition;

type SortState = {
  rankingIds: string[];
  pendingIds: string[];
  low: number;
  high: number;
  comparisons: number;
  skippedCount: number;
};

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

function getRankingLimit(category: SorterCategory) {
  return category === "all" ? allPlayersRankingSize : undefined;
}

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

  function chooseCategory(nextCategory: SorterCategory) {
    const nextPlayers = getPlayersForCategory(nextCategory);
    setCategory(nextCategory);
    setSortState(initializeSort(nextPlayers, nextCategory));
    setHistory([]);
  }

  function chooseWinner(winnerId: string) {
    if (!opponentId || !candidateId) {
      return;
    }

    setHistory((currentHistory) => [...currentHistory, sortState]);
    setSortState((currentState) => recordChoice(currentState, winnerId, opponentId, rankingLimit));
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
