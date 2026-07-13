"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";

import { fetchGeneratedPlayerStats, type GeneratedPlayerStats } from "@/lib/data/generated-player-stats";
import { rosterLastUpdated, teamRosters, type TeamRoster } from "@/lib/data/mlb-rosters";
import { evaluations, teams, type PlayerEvaluation } from "@/lib/data/scouting-reports";

const reportFilters = ["All", "AL", "NL", "MiLB", "Free Agents"] as const;
const trendSplitOptions = [
  { key: "all", label: "All games" },
  { key: "home", label: "Home" },
  { key: "away", label: "Away" },
  { key: "day", label: "Day" },
  { key: "night", label: "Night" }
] as const;
const trendSeriesColors = ["#06d6a0", "#ffd166", "#ef476f", "#4cc9f0", "#b8f35b"];
const trendMonthOrder = new Map(
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, index) => [month, index + 1])
);

function getTrendSortValue(label: string, trendMode: "season" | "month") {
  if (trendMode === "month") {
    const [month, year] = label.split(" ");
    const monthNumber = trendMonthOrder.get(month) ?? 0;
    const yearNumber = Number(year) || 0;

    return yearNumber * 100 + monthNumber;
  }

  return Number(label) || 0;
}

const activeRosterTeamByPlayerId = new Map(
  teamRosters.flatMap((roster) => roster.players.map((player) => [player.id, roster.teamId] as const))
);

function getRosterForTeam(teamId: string) {
  return teamRosters.find((roster) => roster.teamId === teamId);
}

function getRoleForPosition(position: string): PlayerEvaluation["role"] {
  if (position === "P") {
    return "Starting Pitcher";
  }

  if (position === "C") {
    return "Catcher";
  }

  return "Position Player";
}

function createRosterReport(player: TeamRoster["players"][number], teamId: string): PlayerEvaluation {
  const statType = player.position === "P" ? "pitcher" : "hitter";

  return {
    id: `roster-${player.id}`,
    mlbPlayerId: player.id,
    teamId,
    reportStatus: "active-mlb",
    statusNote: "Generated roster shell. Add subjective analysis in scouting-reports.ts when ready.",
    birthPlace: "NA",
    preProPath: "NA",
    playerRating: "NA",
    playerName: player.name,
    position: player.position,
    role: getRoleForPosition(player.position),
    age: 0,
    batsThrows: "TBD",
    reportDate: rosterLastUpdated.slice(0, 10),
    summary: "",
    evaluation: "Subjective evaluation pending.",
    strengths: ["Add strengths after review."],
    questions: ["Add development questions after review."],
    recommendation: "Add role projection and recommendation after review.",
    overallFutureValue: 0,
    risk: "Medium",
    tools: [],
    statGroups: [],
    statHistory: {
      type: statType,
      source: "Generated after running npm run update:player-stats",
      seasons: [],
      career: []
    },
    dataPoints: [],
    trend: [{ label: "Pending", value: 0 }],
    sourceLinks: [
      { label: "MLB Stats", url: `https://www.mlb.com/player/${player.id}` },
      { label: "Baseball Savant", url: `https://baseballsavant.mlb.com/savant-player/${player.id}` },
      { label: "FanGraphs", url: "https://www.fangraphs.com/players" },
      { label: "Baseball Reference", url: "https://www.baseball-reference.com/players/" }
    ],
    tags: ["Roster shell"]
  };
}

function getCurrentTeamIdForReport(evaluation: PlayerEvaluation) {
  if (evaluation.reportStatus && evaluation.reportStatus !== "active-mlb") {
    return undefined;
  }

  return evaluation.mlbPlayerId ? activeRosterTeamByPlayerId.get(evaluation.mlbPlayerId) ?? evaluation.teamId : evaluation.teamId;
}

function getReportsForTeam(teamId: string) {
  const authoredReports = evaluations.filter((evaluation) => getCurrentTeamIdForReport(evaluation) === teamId);
  const authoredPlayerIds = new Set(
    authoredReports.flatMap((evaluation) => (evaluation.mlbPlayerId ? [evaluation.mlbPlayerId] : []))
  );
  const authoredNames = new Set(authoredReports.map((evaluation) => evaluation.playerName.toLowerCase()));
  const rosterReports =
    getRosterForTeam(teamId)?.players
      .filter((player) => !authoredPlayerIds.has(player.id) && !authoredNames.has(player.name.toLowerCase()))
      .map((player) => createRosterReport(player, teamId)) ?? [];

  return [...authoredReports, ...rosterReports];
}

function getReportsForStatus(status: "minor-league" | "free-agent") {
  return evaluations.filter((evaluation) => {
    if (evaluation.reportStatus === status) {
      return true;
    }

    return status === "minor-league" && evaluation.reportStatus === "active-mlb" && !getCurrentTeamIdForReport(evaluation);
  });
}

function TeamButton({
  teamId,
  selectedTeamId,
  onSelect
}: {
  teamId: string;
  selectedTeamId: string;
  onSelect: (teamId: string) => void;
}) {
  const team = teams.find((option) => option.id === teamId);
  const reportCount = getReportsForTeam(teamId).length;
  const rosterCount = getRosterForTeam(teamId)?.players.length ?? 0;

  if (!team) {
    return null;
  }

  return (
    <button
      className={`scouting-team-button${selectedTeamId === team.id ? " active" : ""}`}
      onClick={() => onSelect(team.id)}
      style={{ "--team-color": team.color } as CSSProperties}
      type="button"
    >
      <span>{team.abbreviation}</span>
      <small>
        {rosterCount} players · {reportCount} report{reportCount === 1 ? "" : "s"}
      </small>
    </button>
  );
}

function MiniTrend({ points }: { points: PlayerEvaluation["trend"] }) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const coordinates = points
    .map((point, index) => {
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
      const y = 100 - (point.value / maxValue) * 82 - 8;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="scouting-trend" aria-label="Evaluation trend">
      <svg viewBox="0 0 100 100" role="img" aria-hidden="true">
        <polyline points={coordinates} />
        {points.map((point, index) => {
          const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
          const y = 100 - (point.value / maxValue) * 82 - 8;

          return <circle cx={x} cy={y} key={point.label} r="3" />;
        })}
      </svg>
      <div>
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function ToolGrades({ evaluation }: { evaluation: PlayerEvaluation }) {
  return (
    <section className="scouting-panel">
      <div className="scouting-section-head">
        <p className="eyebrow">20-80 Scale</p>
        <h2>Tool Grades</h2>
      </div>

      <div className="tool-list">
        {evaluation.tools.map((tool) => (
          <article className="tool-row" key={tool.label}>
            <div>
              <strong>{tool.label}</strong>
              <small>{tool.note}</small>
            </div>
            <span>{tool.grade}</span>
            <div className="tool-track" aria-hidden="true">
              <i style={{ width: `${Math.max(0, Math.min(100, ((tool.grade - 20) / 60) * 100))}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidencePanel({ evaluation }: { evaluation: PlayerEvaluation }) {
  return (
    <section className="scouting-panel">
      <div className="scouting-section-head">
        <p className="eyebrow">Data Support</p>
        <h2>Evidence Board</h2>
      </div>

      <div className="data-grid">
        {evaluation.dataPoints.map((point) => (
          <article className="data-point" key={point.label}>
            <div>
              <strong>{point.label}</strong>
              <span>{point.value}</span>
            </div>
            <div className="data-track" aria-hidden="true">
              <i style={{ width: `${point.value}%` }} />
            </div>
            <small>{point.detail}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function parseStatNumber(value: string) {
  const parsed = Number.parseFloat(value.replace("%", ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

function ObjectiveStats({
  evaluation,
  generatedStats
}: {
  evaluation: PlayerEvaluation;
  generatedStats?: GeneratedPlayerStats;
}) {
  const statGroups = generatedStats?.statGroups ?? evaluation.statGroups;

  return (
    <section className="objective-stats">
      <div className="scouting-section-head">
        <p className="eyebrow">Objective Context</p>
        <h2>Stats and Public Data</h2>
      </div>

      {statGroups.length ? (
        <div className="stat-group-grid">
          {statGroups.map((group) => (
            <article className="stat-group" key={group.title}>
              <div className="stat-group-head">
                <h3>{group.title}</h3>
                <span>{group.source}</span>
              </div>

              <div className="stat-grid">
                {group.stats.map((stat) => (
                  <div className="stat-tile" key={`${group.title}-${stat.label}`}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                    {stat.note ? <small>{stat.note}</small> : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-stats-panel">
          <h3>Stats pending</h3>
          <p>Run <code>npm run update:player-stats</code> to generate objective stat cards for this player.</p>
        </div>
      )}
    </section>
  );
}

function StatVisuals({ statHistory }: { statHistory: PlayerEvaluation["statHistory"] }) {
  const [trendMode, setTrendMode] = useState<"season" | "month">("season");
  const [selectedMetric, setSelectedMetric] = useState(statHistory.type === "pitcher" ? "ERA" : "OPS");
  const [selectedSplits, setSelectedSplits] = useState<string[]>(["all"]);
  const barLabels =
    statHistory.type === "pitcher" ? ["ERA", "WHIP", "K", "BB", "HR"] : ["AVG", "OBP", "SLG", "OPS", "HR", "RBI", "SB"];
  const metricLabel = barLabels.includes(selectedMetric) ? selectedMetric : statHistory.type === "pitcher" ? "ERA" : "OPS";
  const splitSeries = statHistory.splitSeries?.length
    ? statHistory.splitSeries
    : [{ key: "all", label: "All games", seasons: statHistory.seasons, months: statHistory.months ?? [] }];
  const activeSplitKeys = selectedSplits.length ? selectedSplits : ["all"];
  const monthlyAvailable = splitSeries.some((series) => series.months.length > 0);
  const trendLabel = trendMode === "month" && monthlyAvailable ? "Month" : "Season";
  const activeSeries = activeSplitKeys
    .map((key) => splitSeries.find((series) => series.key === key))
    .filter((series): series is NonNullable<typeof series> => Boolean(series))
    .map((series, seriesIndex) => {
      const rows = trendMode === "month" && monthlyAvailable ? series.months : series.seasons;
      const points = rows
        .map((row) => {
          const metric = row.stats.find((stat) => stat.label === metricLabel);

          return metric ? { label: row.season, value: parseStatNumber(metric.value), display: metric.value } : undefined;
        })
        .filter((point): point is { label: string; value: number; display: string } => Boolean(point))
        .sort((first, second) => getTrendSortValue(first.label, trendMode) - getTrendSortValue(second.label, trendMode));

      return {
        ...series,
        color: trendSeriesColors[seriesIndex % trendSeriesColors.length],
        points
      };
    })
    .filter((series) => series.points.length > 0);
  const trendLabels = [...new Set(activeSeries.flatMap((series) => series.points.map((point) => point.label)))].sort(
    (first, second) => getTrendSortValue(first, trendMode) - getTrendSortValue(second, trendMode)
  );
  const trendValues = activeSeries.flatMap((series) => series.points.map((point) => point.value));
  const latestTrendPoint = activeSeries[0]?.points.at(-1);
  const maxValue = Math.max(...trendValues, 1);
  const minValue = Math.min(...trendValues, 0);
  const range = Math.max(maxValue - minValue, 0.001);
  const chartPaddingX = 18;
  const chartHeight = 170;
  const chartWidth = Math.max(360, chartPaddingX * 2 + Math.max(trendLabels.length - 1, 1) * 58);
  const chartUsableWidth = chartWidth - chartPaddingX * 2;
  const getX = (label: string) => {
    const index = trendLabels.indexOf(label);

    return trendLabels.length === 1 ? chartWidth / 2 : chartPaddingX + (index / (trendLabels.length - 1)) * chartUsableWidth;
  };
  const getY = (value: number) => 88 - ((value - minValue) / range) * 70;
  const chartSeries = activeSeries.map((series) => ({
    ...series,
    points: series.points.map((point) => ({ ...point, x: getX(point.label), y: getY(point.value) }))
  }));
  const latestSeason = statHistory.seasons.at(-1);
  const careerStats = new Map(statHistory.career.map((stat) => [stat.label, stat.value]));
  const latestStats = new Map(latestSeason?.stats.map((stat) => [stat.label, stat.value]) ?? []);
  const barRows = barLabels
    .map((label) => ({
      label,
      latest: latestStats.get(label),
      career: careerStats.get(label)
    }))
    .filter((row) => row.latest || row.career);
  const toggleSplit = (key: string) => {
    setSelectedSplits((currentSplits) => {
      if (key === "all") {
        return ["all"];
      }

      const withoutAll = currentSplits.filter((currentKey) => currentKey !== "all");
      const nextSplits = withoutAll.includes(key)
        ? withoutAll.filter((currentKey) => currentKey !== key)
        : [...withoutAll, key];

      return nextSplits.length ? nextSplits : ["all"];
    });
  };

  if (!chartSeries.length && !barRows.length) {
    return null;
  }

  return (
    <section className="stat-visuals">
      <div className="scouting-section-head">
        <p className="eyebrow">Visual Summary</p>
        <h2>Performance Trends</h2>
      </div>

      <div className="stat-visual-grid">
        {chartSeries.length ? (
          <article className="stat-trend-card">
            <div className="stat-visual-head">
              <div>
                <h3>{metricLabel} by {trendLabel}</h3>
                <div className="trend-controls">
                  <div className="trend-mode-tabs" aria-label={`${metricLabel} trend view`}>
                    <button
                      className={trendMode === "season" ? "active" : ""}
                      onClick={() => setTrendMode("season")}
                      type="button"
                    >
                      Season
                    </button>
                    <button
                      className={trendMode === "month" ? "active" : ""}
                      disabled={!monthlyAvailable}
                      onClick={() => setTrendMode("month")}
                      type="button"
                    >
                      Monthly
                    </button>
                  </div>
                  <details className="trend-split-filter">
                    <summary>Splits</summary>
                    <div>
                      {trendSplitOptions.map((option) => (
                        <button
                          aria-pressed={activeSplitKeys.includes(option.key)}
                          key={option.key}
                          onClick={() => toggleSplit(option.key)}
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
              <span>{latestTrendPoint?.display}</span>
            </div>
            <div className="trend-scroll" role="region" aria-label={`${metricLabel} ${trendLabel.toLowerCase()} trend chart`}>
              <div className="trend-plot" style={{ width: `${chartWidth}px` }}>
                <svg viewBox={`0 0 ${chartWidth} 100`} role="img" aria-label={`${metricLabel} ${trendLabel.toLowerCase()} trend`}>
                  {chartSeries.map((series) => (
                    <polyline
                      key={series.key}
                      points={series.points.map((point) => `${point.x},${point.y}`).join(" ")}
                      style={{ stroke: series.color }}
                    />
                  ))}
                  {chartSeries.flatMap((series) =>
                    series.points.map((point) => (
                      <circle cx={point.x} cy={point.y} key={`${series.key}-${point.label}`} r="3" style={{ fill: series.color }}>
                        <title>{`${series.label} ${point.label}: ${point.display}`}</title>
                      </circle>
                    ))
                  )}
                </svg>
                {chartSeries.flatMap((series) =>
                  series.points.map((point) => (
                    <button
                      aria-label={`${series.label} ${point.label} ${metricLabel}: ${point.display}`}
                      className="trend-point"
                      key={`${series.key}-${point.label}-tooltip`}
                      style={{ left: `${point.x}px`, top: `${(point.y / 100) * chartHeight}px` }}
                      type="button"
                    >
                      <span>
                        {series.label}: {point.label} {point.display}
                      </span>
                    </button>
                  ))
                )}
                <div className="trend-labels">
                  {trendLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
            {chartSeries.length > 1 ? (
              <div className="trend-legend">
                {chartSeries.map((series) => (
                  <span key={series.key}>
                    <i style={{ background: series.color }} />
                    {series.label}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ) : null}

        {barRows.length ? (
          <article className="stat-bars-card">
            <div className="stat-visual-head">
              <h3>Latest vs Career</h3>
              <span>{latestSeason?.season ?? "Career"}</span>
            </div>
            <div className="stat-bars">
              {barRows.map((row) => {
                const latestValue = parseStatNumber(row.latest ?? "0");
                const careerValue = parseStatNumber(row.career ?? "0");
                const maxRowValue = Math.max(latestValue, careerValue, 1);

                return (
                  <button
                    aria-pressed={metricLabel === row.label}
                    className={`stat-bar-row ${metricLabel === row.label ? "active" : ""}`}
                    key={row.label}
                    onClick={() => setSelectedMetric(row.label)}
                    type="button"
                  >
                    <strong>{row.label}</strong>
                    <div>
                      <span>Latest {row.latest ?? "-"}</span>
                      <i style={{ width: `${Math.max(4, (latestValue / maxRowValue) * 100)}%` }} />
                    </div>
                    <div>
                      <span>Career {row.career ?? "-"}</span>
                      <i style={{ width: `${Math.max(4, (careerValue / maxRowValue) * 100)}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function StatHistoryTable({
  evaluation,
  generatedStats
}: {
  evaluation: PlayerEvaluation;
  generatedStats?: GeneratedPlayerStats;
}) {
  const statHistory = generatedStats?.statHistory ?? evaluation.statHistory;
  const firstSeason = statHistory.seasons[0];
  const statLabels = firstSeason?.stats.map((stat) => stat.label) ?? [];
  const careerStatsByLabel = new Map(statHistory.career.map((stat) => [stat.label, stat.value]));

  if (!firstSeason) {
    return null;
  }

  return (
    <section className="stat-history">
      <div className="scouting-section-head">
        <p className="eyebrow">Career Context</p>
        <h2>Season-by-Season Stats</h2>
      </div>

      <div className="stat-history-meta">
        <span>{statHistory.type === "pitcher" ? "Pitching" : "Hitting"} table</span>
        <span>{generatedStats ? `Updated ${new Date(generatedStats.lastUpdated).toLocaleDateString()}` : statHistory.source}</span>
      </div>

      <div className="stat-history-scroll">
        <table className="stat-history-table">
          <thead>
            <tr>
              <th>Season</th>
              <th>Team</th>
              <th>Level</th>
              {statLabels.map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statHistory.seasons.map((row) => {
              const statsByLabel = new Map(row.stats.map((stat) => [stat.label, stat.value]));

              return (
                <tr key={`${row.season}-${row.team}-${row.level}`}>
                  <td>{row.season}</td>
                  <td>{row.team}</td>
                  <td>{row.level}</td>
                  {statLabels.map((label) => (
                    <td key={label}>{statsByLabel.get(label) ?? "-"}</td>
                  ))}
                </tr>
              );
            })}
            <tr className="career-row">
              <td>Career</td>
              <td>All</td>
              <td>All</td>
              {statLabels.map((label) => (
                <td key={label}>{careerStatsByLabel.get(label) ?? "-"}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatRosterDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

function RosterPanel({
  reports,
  roster,
  selectedEvaluationId,
  onSelectEvaluation
}: {
  reports: PlayerEvaluation[];
  roster?: TeamRoster;
  selectedEvaluationId: string;
  onSelectEvaluation: (evaluationId: string) => void;
}) {
  const reportsByPlayerId = new Map(
    reports.flatMap((report) => (report.mlbPlayerId ? [[report.mlbPlayerId, report] as const] : []))
  );
  const reportsByName = new Map(reports.map((report) => [report.playerName.toLowerCase(), report]));

  if (!roster) {
    return (
      <div className="empty-team-state">
        <h3>Roster data unavailable.</h3>
        <p>This team did not return an active roster from the latest MLB roster update.</p>
      </div>
    );
  }

  return (
    <section className="roster-panel" aria-label={`${roster.name} active roster`}>
      <div className="roster-head">
        <div>
          <p className="eyebrow">Active Roster</p>
          <h3>{roster.players.length} players</h3>
        </div>
        <span>Updated {formatRosterDate(rosterLastUpdated)}</span>
      </div>

      <div className="roster-grid">
        {roster.players.map((player) => {
          const report = reportsByPlayerId.get(player.id) ?? reportsByName.get(player.name.toLowerCase());
          const active = report?.id === selectedEvaluationId;
          const generatedShell = report?.id.startsWith("roster-");

          return report ? (
            <button
              className={`roster-player has-report${generatedShell ? " report-shell" : ""}${active ? " active" : ""}`}
              key={player.id}
              onClick={() => onSelectEvaluation(report.id)}
              type="button"
            >
              <span>{player.jerseyNumber ? `#${player.jerseyNumber}` : "--"}</span>
              <strong>{player.name}</strong>
              <small>
                {player.position} · {generatedShell ? "Analysis pending" : "Report written"}
              </small>
            </button>
          ) : (
            <article className="roster-player" key={player.id}>
              <span>{player.jerseyNumber ? `#${player.jerseyNumber}` : "--"}</span>
              <strong>{player.name}</strong>
              <small>
                {player.position} · Report queued
              </small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ReportView({ evaluation }: { evaluation: PlayerEvaluation }) {
  const [generatedStats, setGeneratedStats] = useState<GeneratedPlayerStats>();
  const currentTeamId = getCurrentTeamIdForReport(evaluation);
  const team = teams.find((option) => option.id === (currentTeamId ?? evaluation.teamId));
  const displayAge = generatedStats?.age ?? (evaluation.age > 0 ? evaluation.age : "NA");
  const displayBirthPlace = generatedStats?.birthPlace ?? evaluation.birthPlace ?? "NA";
  const displayPreProPath = generatedStats?.preProPath ?? evaluation.preProPath ?? "NA";
  const displayPlayerRating = evaluation.playerRating ?? "NA";
  const statusLabel =
    evaluation.reportStatus === "minor-league"
      ? "Minor League"
      : evaluation.reportStatus === "free-agent"
        ? "Free Agent"
        : "Active MLB";

  useEffect(() => {
    let ignoreResult = false;

    setGeneratedStats(undefined);

    if (!evaluation.mlbPlayerId) {
      return () => {
        ignoreResult = true;
      };
    }

    fetchGeneratedPlayerStats(evaluation.mlbPlayerId).then((stats) => {
      if (!ignoreResult) {
        setGeneratedStats(stats);
      }
    });

    return () => {
      ignoreResult = true;
    };
  }, [evaluation.mlbPlayerId]);

  return (
    <div className="scouting-report-grid">
      <section className="scouting-report-main">
        <div className="report-kicker">
          <span>{team?.name ?? statusLabel}</span>
          <span>{evaluation.reportDate}</span>
        </div>
        <h1>{evaluation.playerName}</h1>
        {evaluation.summary ? <p className="report-summary">{evaluation.summary}</p> : null}

        <div className="report-meta-grid">
          <span>
            <strong>{evaluation.position}</strong>
            Position
          </span>
          <span>
            <strong>{displayAge}</strong>
            Age
          </span>
          <span>
            <strong>{displayBirthPlace}</strong>
            From
          </span>
          <span>
            <strong>{displayPreProPath}</strong>
            Background
          </span>
          <span>
            <strong>{displayPlayerRating}</strong>
            Rating
          </span>
        </div>
        <div className="report-status-note">
          <strong>{statusLabel}</strong>
          <span>
            {evaluation.statusNote ??
              (evaluation.mlbPlayerId
                ? "Report is keyed by MLB player ID and can follow the player when active rosters refresh."
                : "Add an MLB player ID to let this report follow future roster changes automatically.")}
          </span>
        </div>

        <div className="report-copy">
          <h2>Evaluation</h2>
          <p>{evaluation.evaluation}</p>
        </div>

        <ObjectiveStats evaluation={evaluation} generatedStats={generatedStats} />

        <StatVisuals statHistory={generatedStats?.statHistory ?? evaluation.statHistory} />

        <StatHistoryTable evaluation={evaluation} generatedStats={generatedStats} />

        <div className="report-two-column">
          <div>
            <h3>Strengths</h3>
            <ul>
              {evaluation.strengths.map((strength) => (
                <li key={strength}>{strength}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Questions</h3>
            <ul>
              {evaluation.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="recommendation">
          <h3>Recommendation</h3>
          <p>{evaluation.recommendation}</p>
        </div>
      </section>

      <aside className="scouting-sidebar">
        <section className="scouting-panel fv-panel">
          <p className="eyebrow">Role Projection</p>
          <strong>{evaluation.overallFutureValue}</strong>
          <span>{evaluation.role}</span>
          <MiniTrend points={evaluation.trend} />
        </section>
      </aside>
    </div>
  );
}

export function ScoutingPortfolio() {
  const [reportFilter, setReportFilter] = useState<(typeof reportFilters)[number]>("All");
  const [selectedTeamId, setSelectedTeamId] = useState("orioles");
  const [selectedEvaluationId, setSelectedEvaluationId] = useState(evaluations[0]?.id ?? "");

  const visibleTeams = useMemo(
    () =>
      teams.filter((team) => {
        if (reportFilter === "AL" || reportFilter === "NL") {
          return team.league === reportFilter;
        }

        return reportFilter === "All";
      }),
    [reportFilter]
  );
  const minorLeagueReports = getReportsForStatus("minor-league");
  const freeAgentReports = getReportsForStatus("free-agent");
  const statusReports = reportFilter === "MiLB" ? minorLeagueReports : reportFilter === "Free Agents" ? freeAgentReports : [];
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0];
  const selectedTeamReports = getReportsForTeam(selectedTeam.id);
  const selectedTeamRoster = getRosterForTeam(selectedTeam.id);
  const activeReportPool = reportFilter === "MiLB" || reportFilter === "Free Agents" ? statusReports : selectedTeamReports;
  const selectedEvaluation = activeReportPool.find((evaluation) => evaluation.id === selectedEvaluationId) ?? activeReportPool[0];

  function selectTeam(teamId: string) {
    const nextReports = getReportsForTeam(teamId);
    setSelectedTeamId(teamId);
    setSelectedEvaluationId(nextReports[0]?.id ?? "");
  }

  function chooseReportFilter(nextFilter: (typeof reportFilters)[number]) {
    setReportFilter(nextFilter);

    if (nextFilter === "MiLB") {
      setSelectedEvaluationId(minorLeagueReports[0]?.id ?? "");
      return;
    }

    if (nextFilter === "Free Agents") {
      setSelectedEvaluationId(freeAgentReports[0]?.id ?? "");
      return;
    }

    const nextTeam = teams.find((team) => nextFilter === "All" || team.league === nextFilter) ?? selectedTeam;
    const nextReports = getReportsForTeam(nextTeam.id);
    setSelectedTeamId(nextTeam.id);
    setSelectedEvaluationId(nextReports[0]?.id ?? "");
  }

  return (
    <main className="scouting-shell">
      <section className="scouting-hero">
        <div className="scouting-hero-copy">
          <p className="eyebrow">Baseball scouting portfolio</p>
          <h1>Player Evaluations</h1>
          <p>
            Player evaluation reports across MLB organizations, pairing player evaluations with
            data visuals, tool grades, trend notes, video observations, and recommendations.
          </p>
          <div className="scouting-actions">
            <a href="#reports">View Reports</a>
            <a href="mailto:your.email@example.com">Contact</a>
          </div>
        </div>

        <div className="diamond-visual" aria-label="Scouting dashboard visual">
          <div className="diamond-field">
            <span className="base home" />
            <span className="base first" />
            <span className="base second" />
            <span className="base third" />
            <i />
          </div>
        </div>
      </section>

      <section className="scouting-board" id="reports">
        <div className="scouting-section-head">
          <p className="eyebrow">Report Library</p>
          <h2>Team-by-team evaluations</h2>
        </div>

        <div className="league-tabs" aria-label="Report filters">
          {reportFilters.map((option) => (
            <button
              className={reportFilter === option ? "active" : ""}
              key={option}
              onClick={() => chooseReportFilter(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>

        {reportFilter === "MiLB" || reportFilter === "Free Agents" ? (
          <div className="status-report-panel">
            <h3>{reportFilter === "MiLB" ? "MiLB Reports" : "Free Agent Reports"}</h3>
            {statusReports.length ? (
              <div className="player-tabs" aria-label={`${reportFilter} evaluations`}>
                {statusReports.map((evaluation) => (
                  <button
                    className={selectedEvaluation?.id === evaluation.id ? "active" : ""}
                    key={evaluation.id}
                    onClick={() => setSelectedEvaluationId(evaluation.id)}
                    type="button"
                  >
                    <strong>{evaluation.playerName}</strong>
                    <span>{evaluation.position} · Rating {evaluation.playerRating ?? "NA"}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-team-state">
                <h3>No {reportFilter === "MiLB" ? "MiLB" : "free agent"} reports yet.</h3>
                <p>Reports with this status will stay here instead of being removed during roster updates.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="team-grid">
              {visibleTeams.map((team) => (
                <TeamButton key={team.id} onSelect={selectTeam} selectedTeamId={selectedTeam.id} teamId={team.id} />
              ))}
            </div>

            <div className="selected-team-row">
              <div>
                <p className="eyebrow">{selectedTeam.league} {selectedTeam.division}</p>
                <h3>{selectedTeam.name}</h3>
              </div>
              <span>
                {selectedTeamRoster?.players.length ?? 0} roster players ·{" "}
                {selectedTeamReports.length ? `${selectedTeamReports.length} evaluation published` : "Reports coming soon"}
              </span>
            </div>

            <RosterPanel
              onSelectEvaluation={setSelectedEvaluationId}
              reports={selectedTeamReports}
              roster={selectedTeamRoster}
              selectedEvaluationId={selectedEvaluation?.id ?? ""}
            />

            {selectedTeamReports.length ? (
              <div className="player-tabs" aria-label={`${selectedTeam.name} evaluations`}>
                {selectedTeamReports.map((evaluation) => (
                  <button
                    className={selectedEvaluation?.id === evaluation.id ? "active" : ""}
                    key={evaluation.id}
                    onClick={() => setSelectedEvaluationId(evaluation.id)}
                    type="button"
                  >
                    <strong>{evaluation.playerName}</strong>
                    <span>{evaluation.position} · Rating {evaluation.playerRating ?? "NA"}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-team-state">
                <h3>{selectedTeam.abbreviation} reports coming soon.</h3>
                <p>
                  I have this organization queued for future coverage as I continue building out the player evaluation
                  library.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {selectedEvaluation ? <ReportView evaluation={selectedEvaluation} /> : null}
    </main>
  );
}
