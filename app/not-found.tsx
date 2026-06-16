import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="empty-card">
      <h1>Player or page not found.</h1>
      <p>The requested route does not exist in this demo dataset yet.</p>
      <div className="button-row">
        <Link className="button" href="/">
          Return home
        </Link>
        <Link className="ghost-button" href="/compare">
          Open compare workspace
        </Link>
      </div>
    </section>
  );
}
