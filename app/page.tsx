import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-shell">
      <section className="home-hero">
        <p className="eyebrow">Choose a section</p>
        <h1>Sports Ranking Hub</h1>
      </section>

      <section className="section-grid" aria-label="Sports sections">
        <Link className="section-card baseball-card" href="/baseball">
          <span className="section-mark">MLB</span>
          <span>
            <strong>Baseball Ranking System</strong>
            <small>Rank MLB players through head-to-head choices.</small>
          </span>
        </Link>

        <Link className="section-card football-card" href="/fantasy-football">
          <span className="section-mark">FF</span>
          <span>
            <strong>Fantasy Football Section</strong>
            <small>Start building fantasy football rankings and tools.</small>
          </span>
        </Link>
      </section>
    </main>
  );
}
