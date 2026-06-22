"use client";

import { useMemo, useState } from "react";

import { fantasyDraftRows, fantasyDraftSummary } from "@/lib/data/fantasy-draft";
import {
  FantasyCategory,
  fantasyScoringNote,
  fantasySeasonRows,
  fantasySummary,
  fantasyWeeklyRows
} from "@/lib/data/fantasy-football";
import {
  fantasyProjectionRows,
  fantasyProjectionSummary,
} from "@/lib/data/fantasy-projections";
import { movementRows, movementSource, MovementType } from "@/lib/data/fantasy-movement";

type ViewMode = "draft" | "projection" | "season" | "week" | "movement";
type MovementFilter = "all" | MovementType;
type MovementPosition = "all" | "QB" | "RB" | "WR" | "TE" | "FB" | "Head coach";
type FantasyPositionFilter = "all" | "QB" | "RB" | "WR" | "TE" | "FB";

const categories: Array<{ id: FantasyCategory; label: string; statLabels: string[] }> = [
  { id: "passing", label: "Passing", statLabels: ["passing_yards", "passing_tds", "interceptions"] },
  { id: "rushing", label: "Rushing", statLabels: ["rushing_yards", "rushing_tds", "carries"] },
  { id: "receiving", label: "Receiving", statLabels: ["receiving_yards", "receiving_tds", "receptions"] }
];

const labelMap: Record<string, string> = {
  attempts: "Att",
  average: "Avg",
  carries: "Car",
  completions: "Cmp",
  fumbles: "Fum",
  interceptions: "INT",
  long: "Long",
  passer_rating: "Rating",
  passing_tds: "Pass TD",
  passing_yards: "Pass Yds",
  receiving_tds: "Rec TD",
  receiving_yards: "Rec Yds",
  receptions: "Rec",
  rushing_tds: "Rush TD",
  rushing_yards: "Rush Yds",
  sacks: "Sacks"
};

const movementPositions: MovementPosition[] = ["all", "QB", "RB", "WR", "TE", "FB", "Head coach"];
const fantasyPositions: FantasyPositionFilter[] = ["all", "QB", "RB", "WR", "TE", "FB"];

function formatStat(value: string | number | undefined) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  if (typeof value === "number" && !Number.isInteger(value)) {
    return value.toFixed(1);
  }
  return String(value);
}

export function FantasyFootballDashboard() {
  const [category, setCategory] = useState<FantasyCategory>("passing");
  const [viewMode, setViewMode] = useState<ViewMode>("draft");
  const [week, setWeek] = useState(1);
  const [movementType, setMovementType] = useState<MovementFilter>("all");
  const [movementPosition, setMovementPosition] = useState<MovementPosition>("all");
  const [positionFilter, setPositionFilter] = useState<FantasyPositionFilter>("all");
  const [selectedProjectionPlayer, setSelectedProjectionPlayer] = useState<string | null>(null);

  const activeCategory = categories.find((item) => item.id === category) ?? categories[0];
  const draftRows = useMemo(
    () =>
      fantasyDraftRows
        .filter((row) => positionFilter === "all" || row.position === positionFilter)
        .slice(0, 100),
    [positionFilter]
  );
  const seasonRows = useMemo(
    () =>
      fantasySeasonRows
        .filter((row) => row.category === category && (positionFilter === "all" || row.position === positionFilter))
        .slice(0, 50),
    [category, positionFilter]
  );
  const weeklyRows = useMemo(
    () =>
      fantasyWeeklyRows
        .filter(
          (row) =>
            row.category === category &&
            row.week === week &&
            (positionFilter === "all" || row.position === positionFilter)
        )
        .slice(0, 50),
    [category, positionFilter, week]
  );
  const filteredMovementRows = useMemo(
    () =>
      movementRows.filter((row) => {
        const rowPosition = row.type === "coach" ? row.role : row.position;
        return (
          (movementType === "all" || row.type === movementType) &&
          (movementPosition === "all" || rowPosition === movementPosition)
        );
      }),
    [movementPosition, movementType]
  );
  const projectionRows = useMemo(
    () =>
      fantasyProjectionRows
        .filter((row) => positionFilter === "all" || row.position === positionFilter)
        .slice(0, 120),
    [positionFilter]
  );
  const selectedProjection = selectedProjectionPlayer
    ? fantasyProjectionRows.find((row) => row.player === selectedProjectionPlayer) ?? null
    : null;
  const rows = viewMode === "season" ? seasonRows : weeklyRows;
  const statLeader = viewMode === "draft" ? draftRows[0] : rows[0];
  const movementPlayerCount = filteredMovementRows.filter((row) => row.type === "player").length;
  const movementCoachCount = filteredMovementRows.filter((row) => row.type === "coach").length;
  const currentLeader =
    viewMode === "movement"
      ? filteredMovementRows[0]?.name
      : viewMode === "projection"
        ? projectionRows[0]?.player
        : statLeader?.player;

  return (
    <main className="fantasy-shell">
      <section className="fantasy-hero">
        <p className="eyebrow">Fantasy Football</p>
        <h1>Fantasy Draft Assistant</h1>
        <p className="muted">{fantasyDraftSummary.model}</p>
        <p className="muted">{fantasyScoringNote}</p>
      </section>

      <section className="fantasy-controls">
        <div className="sorter-tabs" role="list">
          <button
            className={viewMode === "draft" ? "sorter-tab active" : "sorter-tab"}
            onClick={() => setViewMode("draft")}
            type="button"
          >
            Draft assistant
          </button>
          <button
            className={viewMode === "projection" ? "sorter-tab active" : "sorter-tab"}
            onClick={() => setViewMode("projection")}
            type="button"
          >
            2026 projections
          </button>
          <button
            className={viewMode === "season" ? "sorter-tab active" : "sorter-tab"}
            onClick={() => setViewMode("season")}
            type="button"
          >
            Season totals
          </button>
          <button
            className={viewMode === "week" ? "sorter-tab active" : "sorter-tab"}
            onClick={() => setViewMode("week")}
            type="button"
          >
            Weekly leaders
          </button>
          <button
            className={viewMode === "movement" ? "sorter-tab active" : "sorter-tab"}
            onClick={() => setViewMode("movement")}
            type="button"
          >
            Movement tracker
          </button>
        </div>

        {viewMode === "season" || viewMode === "week" ? (
          <div className="sorter-tabs" role="list">
            {categories.map((option) => (
              <button
                className={option.id === category ? "sorter-tab active" : "sorter-tab"}
                key={option.id}
                onClick={() => setCategory(option.id)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {viewMode === "week" ? (
          <label className="week-select">
            <span>Week</span>
            <select onChange={(event) => setWeek(Number(event.target.value))} value={week}>
              {fantasySummary.weeks.map((weekNumber) => (
                <option key={weekNumber} value={weekNumber}>
                  {weekNumber}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {viewMode !== "movement" ? (
          <label className="week-select">
            <span>Position</span>
            <select
              onChange={(event) => {
                setPositionFilter(event.target.value as FantasyPositionFilter);
                setSelectedProjectionPlayer(null);
              }}
              value={positionFilter}
            >
              {fantasyPositions.map((position) => (
                <option key={position} value={position}>
                  {position === "all" ? "All" : position}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {viewMode === "movement" ? (
          <>
            <div className="sorter-tabs" role="list">
              {[
                { id: "all", label: "All movement" },
                { id: "player", label: "Players" },
                { id: "coach", label: "Coaches" }
              ].map((option) => (
                <button
                  className={movementType === option.id ? "sorter-tab active" : "sorter-tab"}
                  key={option.id}
                  onClick={() => setMovementType(option.id as MovementFilter)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="week-select">
              <span>Position</span>
              <select
                onChange={(event) => setMovementPosition(event.target.value as MovementPosition)}
                value={movementPosition}
              >
                {movementPositions.map((position) => (
                  <option key={position} value={position}>
                    {position === "all" ? "All" : position}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
      </section>

      <section className="fantasy-kpis">
        <article>
          <strong>
            {viewMode === "movement"
              ? filteredMovementRows.length
              : viewMode === "projection"
                ? projectionRows.length
              : viewMode === "draft"
                ? draftRows.length
                : rows.length}
          </strong>
          <span className="muted">
            {viewMode === "movement"
              ? "moves shown"
              : viewMode === "projection"
                ? "projection board"
                : viewMode === "draft"
                  ? "players shown"
                  : "rows shown"}
          </span>
        </article>
        <article>
          <strong>
            {viewMode === "movement"
              ? movementPlayerCount
              : viewMode === "projection"
                ? projectionRows[0]?.projectedPoints.toFixed(1) ?? "-"
              : viewMode === "draft"
              ? fantasyDraftSummary.expectedModel.receiving.toFixed(2)
              : rows.length}
          </strong>
          <span className="muted">
            {viewMode === "movement"
              ? "player moves"
              : viewMode === "projection"
                ? "top projection"
                : viewMode === "draft"
                  ? "pts per target baseline"
                  : "filtered rows"}
          </span>
        </article>
        <article>
          <strong>{viewMode === "movement" ? movementCoachCount : currentLeader ?? "-"}</strong>
          <span className="muted">{viewMode === "movement" ? "coach changes" : "current leader"}</span>
        </article>
      </section>

      <section className="fantasy-table-card">
        <div className="compare-headline">
          <p className="eyebrow">
            {viewMode === "draft"
              ? "Draft assistant"
              : viewMode === "season"
                ? "Season totals"
                : viewMode === "projection"
                  ? "Projected 2026"
                : viewMode === "movement"
                  ? "2026 offseason"
                  : `Week ${week}`}
          </p>
          <h2>
            {viewMode === "draft"
              ? "Overall draft board"
              : viewMode === "projection"
                ? "Projected season points"
              : viewMode === "movement"
                ? "Player and coach movement"
                : `${activeCategory.label} rankings`}
          </h2>
          {viewMode === "projection" ? <p className="source-note">{fantasyProjectionSummary.source}</p> : null}
          {viewMode === "movement" ? <p className="source-note">{movementSource}</p> : null}
        </div>
        <div className="table-scroll">
          {viewMode === "draft" ? (
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Team</th>
                  <th>Pos</th>
                  <th>Draft score</th>
                  <th>Actual</th>
                  <th>Expected</th>
                  <th>+/- Exp</th>
                  <th>Yds Cons.</th>
                  <th>Targets</th>
                  <th>Target Rel.</th>
                  <th>Def Boost</th>
                </tr>
              </thead>
              <tbody>
                {draftRows.map((row) => (
                  <tr key={`${row.rank}-${row.player}-${row.team}`}>
                    <td className="cell-strong">#{row.rank}</td>
                    <td>{row.player}</td>
                    <td>{row.team}</td>
                    <td>{row.position}</td>
                    <td className="cell-strong">{row.draftScore.toFixed(1)}</td>
                    <td>{row.actualPoints.toFixed(1)}</td>
                    <td>{row.expectedPoints.toFixed(1)}</td>
                    <td>{row.outperformance > 0 ? "+" : ""}{row.outperformance.toFixed(1)}</td>
                    <td>{row.yardConsistencyScore.toFixed(1)}</td>
                    <td>{row.targets || "-"}</td>
                    <td>{row.targetReliabilityScore ? row.targetReliabilityScore.toFixed(1) : "-"}</td>
                    <td>{row.defenseBoost.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : viewMode === "projection" ? (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Pos</th>
                    <th>Proj pts</th>
                    <th>Proj avg</th>
                    <th>2025 pts</th>
                    <th>Team adj</th>
                    <th>Coach adj</th>
                    <th>Defense adj</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {projectionRows.map((row) => (
                    <tr key={`${row.rank}-${row.player}-${row.team}`}>
                      <td className="cell-strong">#{row.rank}</td>
                      <td>
                        <button
                          className="table-link"
                          onClick={() => setSelectedProjectionPlayer(row.player)}
                          type="button"
                        >
                          {row.player}
                        </button>
                      </td>
                      <td>{row.previousTeam === row.team ? row.team : `${row.previousTeam} to ${row.team}`}</td>
                      <td>{row.position}</td>
                      <td className="cell-strong">{row.projectedPoints.toFixed(1)}</td>
                      <td>{row.projectedWeeklyAverage.toFixed(1)}</td>
                      <td>{row.points2025.toFixed(1)}</td>
                      <td>{row.teamAdjustment.toFixed(2)}</td>
                      <td>{row.coachAdjustment.toFixed(2)}</td>
                      <td>{row.defenseAdjustment.toFixed(2)}</td>
                      <td>{row.confidence.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : viewMode === "movement" ? (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Position</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Move</th>
                  <th>Fantasy note</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovementRows.map((row) => (
                  <tr key={`${row.type}-${row.name}-${row.fromTeam}-${row.toTeam}`}>
                    <td className="cell-strong">{row.type === "coach" ? "Coach" : "Player"}</td>
                    <td>{row.name}</td>
                    <td>{row.type === "coach" ? row.role : row.position}</td>
                    <td>{row.fromTeam}</td>
                    <td>{row.toTeam}</td>
                    <td>{row.type === "coach" ? `Replaced ${row.replaced}` : row.moveType}</td>
                    <td className="movement-note">{row.fantasyNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Team</th>
                  <th>Pos</th>
                  <th>Pts</th>
                  {viewMode === "season" ? <th>G</th> : <th>Result</th>}
                  {activeCategory.statLabels.map((stat) => (
                    <th key={stat}>{labelMap[stat]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.category}-${row.rank}-${row.player}-${"week" in row ? row.week : "season"}`}>
                    <td className="cell-strong">#{row.rank}</td>
                    <td>{row.player}</td>
                    <td>{row.team}</td>
                    <td>{row.position}</td>
                    <td className="cell-strong">{row.fantasyPoints.toFixed(1)}</td>
                    {viewMode === "season" ? <td>{"weeks" in row ? row.weeks : "-"}</td> : <td>{"result" in row ? row.result : "-"}</td>}
                    {activeCategory.statLabels.map((stat) => (
                      <td key={stat}>{formatStat(row.stats[stat])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {selectedProjection ? (
        <div
          aria-label={`${selectedProjection.player} weekly projection`}
          aria-modal="true"
          className="projection-modal-backdrop"
          role="dialog"
        >
          <div className="projection-modal">
            <div className="projection-modal-head">
              <div>
                <p className="eyebrow">{selectedProjection.position} weekly projection</p>
                <h2>{selectedProjection.player}</h2>
                <p className="source-note">{selectedProjection.note}</p>
              </div>
              <button
                aria-label="Close projection"
                className="modal-close"
                onClick={() => setSelectedProjectionPlayer(null)}
                type="button"
              >
                x
              </button>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Projected pts</th>
                    <th>Similar defense</th>
                    <th>Defense adj</th>
                    <th>Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProjection.weeks.map((projectionWeek) => (
                    <tr key={`${selectedProjection.player}-${projectionWeek.week}`}>
                      <td className="cell-strong">Week {projectionWeek.week}</td>
                      <td>{projectionWeek.projectedPoints.toFixed(1)}</td>
                      <td>{projectionWeek.opponentTier}</td>
                      <td>{projectionWeek.defenseAdjustment ? projectionWeek.defenseAdjustment.toFixed(2) : "-"}</td>
                      <td className="movement-note">{projectionWeek.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
