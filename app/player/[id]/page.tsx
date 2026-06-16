import Link from "next/link";
import { notFound } from "next/navigation";

import { MetricDefinitions } from "@/components/MetricDefinitions";
import { getMetricsForRole } from "@/lib/metrics";
import { getPlayerSummary } from "@/lib/repository";

type PlayerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;
  const summary = getPlayerSummary(id);

  if (!summary) {
    notFound();
  }

  const compareHref = `/compare?players=${summary.player.id}&role=${summary.availableRoles[0]}&mode=season`;

  return (
    <div className="player-layout">
      <aside className="stack sticky-col">
        <section className="info-card">
          <div className="cluster">
            <span className="tag">{summary.player.primaryRole}</span>
            <span className="tag">
              {summary.player.bats}/{summary.player.throws}
            </span>
          </div>
          <h3>{summary.player.fullName}</h3>
          <p>{summary.player.bio}</p>
          <div className="cluster">
            {summary.player.teams.map((team) => (
              <span className="pill" key={team}>
                {team}
              </span>
            ))}
          </div>
          <div className="button-row" style={{ marginTop: 16 }}>
            <Link className="button" href={compareHref}>
              Compare this player
            </Link>
          </div>
        </section>
      </aside>
      <div className="stack">
        <div className="player-header">
          <p className="eyebrow">Player detail</p>
          <h1>{summary.player.fullName}</h1>
          <p>
            View role coverage, recent seasons, and career aggregate snapshots before sending this player into a
            full comparison workflow.
          </p>
        </div>

        <section className="table-card">
          <h2>Available roles</h2>
          <div className="cluster">
            {summary.availableRoles.map((role) => (
              <span className="pill active" key={role}>
                {role}
              </span>
            ))}
          </div>
        </section>

        <section className="table-card">
          <h2>Recent seasons</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Team</th>
                  <th>Role</th>
                  <th>WAR</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentSeasons.map((season) => (
                  <tr key={season.id}>
                    <td>{season.season}</td>
                    <td>{season.team}</td>
                    <td>{season.role}</td>
                    <td>{season.stats.war ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {summary.hitter ? (
          <section className="table-card">
            <h2>Hitter snapshot</h2>
            <div className="kpi-grid">
              <div className="kpi">
                <strong>{summary.hitter.stats.war}</strong>
                <span className="muted">Career WAR</span>
              </div>
              <div className="kpi">
                <strong>{summary.hitter.stats.wrc_plus}</strong>
                <span className="muted">Career wRC+</span>
              </div>
              <div className="kpi">
                <strong>{summary.hitter.peakWindow.years.join("-")}</strong>
                <span className="muted">Peak window</span>
              </div>
            </div>
          </section>
        ) : null}

        {summary.pitcher ? (
          <section className="table-card">
            <h2>Pitcher snapshot</h2>
            <div className="kpi-grid">
              <div className="kpi">
                <strong>{summary.pitcher.stats.war}</strong>
                <span className="muted">Career WAR</span>
              </div>
              <div className="kpi">
                <strong>{summary.pitcher.stats.era}</strong>
                <span className="muted">Career ERA</span>
              </div>
              <div className="kpi">
                <strong>{summary.pitcher.peakWindow.years.join("-")}</strong>
                <span className="muted">Peak window</span>
              </div>
            </div>
          </section>
        ) : null}

        <MetricDefinitions
          metrics={getMetricsForRole(summary.availableRoles[0]).slice(0, 4)}
        />
      </div>
    </div>
  );
}
