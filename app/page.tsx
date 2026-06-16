import Link from "next/link";

import { MetricDefinitions } from "@/components/MetricDefinitions";
import { PlayerCard } from "@/components/PlayerCard";
import { getMetricsForRole } from "@/lib/metrics";
import { getPlayers } from "@/lib/repository";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const players = getPlayers().filter((player) => {
    if (!query) {
      return true;
    }

    return (
      player.fullName.toLowerCase().includes(query) ||
      player.primaryRole.toLowerCase().includes(query) ||
      player.teams.some((team) => team.toLowerCase().includes(query)) ||
      player.aliases.some((alias) => alias.toLowerCase().includes(query))
    );
  });
  const hitterMetrics = getMetricsForRole("hitter").slice(0, 4);
  const pitcherMetrics = getMetricsForRole("pitcher").slice(0, 4);
  const featuredMetrics = [...hitterMetrics, ...pitcherMetrics].filter(
    (metric, index, all) => all.findIndex((candidate) => candidate.id === metric.id) === index
  );

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">MLB research workstation</p>
            <h1>Compare players fast.</h1>
            <p>Year-by-year, career, and situational MLB comparisons with shareable links.</p>
            <div className="button-row">
              <Link className="button" href="/sort">
                Rank players
              </Link>
              <Link className="button" href="/compare">
                Open compare
              </Link>
              <Link className="ghost-button" href="/player/shohei-ohtani">
                Player page
              </Link>
            </div>
            <div className="stats-strip">
              <div className="stat-chip">
                <strong>2-6</strong>
                <span className="muted">players</span>
              </div>
              <div className="stat-chip">
                <strong>Daily</strong>
                <span className="muted">data refresh</span>
              </div>
              <div className="stat-chip">
                <strong>Situations</strong>
                <span className="muted">split filters</span>
              </div>
            </div>
          </div>
          <div className="panel" style={{ padding: 24 }}>
            <div className="stack">
              <div className="kpi-grid">
                <div className="kpi">
                  <strong>WAR</strong>
                  <span className="muted">value</span>
                </div>
                <div className="kpi">
                  <strong>wRC+</strong>
                  <span className="muted">batting</span>
                </div>
                <div className="kpi">
                  <strong>FIP</strong>
                  <span className="muted">pitching</span>
                </div>
              </div>
              <div className="info-card">
                <h3>Quick view</h3>
                <p>No login. Pick players, compare seasons, share the link.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel" style={{ padding: 24 }}>
        <div className="compare-headline">
          <p className="eyebrow">Player library</p>
          <h1>Choose your player:</h1>
          <form action="/" className="library-search">
            <input defaultValue={query} name="q" placeholder="Search by name, team, role, or alias" type="search" />
            <button className="button" type="submit">
              Search
            </button>
          </form>
        </div>
        {players.length ? (
          <div className="player-list">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <section className="empty-card">No players matched that search.</section>
        )}
      </section>

      <section className="stack">
        <div className="compare-headline">
          <p className="eyebrow">Metric definitions</p>
          <h1>Formulas for the stats on screen.</h1>
          <p>Each card now shows the exact calculation instead of category badges.</p>
        </div>
        <MetricDefinitions metrics={featuredMetrics} />
      </section>
    </div>
  );
}
