import type { Metadata } from "next";
import Link from "next/link";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Baseball Compare Lab",
  description: "Create detailed MLB hitter and pitcher comparisons with public advanced stats."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="topbar">
            <div>
              <Link className="brand" href="/">
                Baseball Compare Lab
              </Link>
              <p className="eyebrow">Research-first MLB player comparisons</p>
            </div>
            <nav className="topnav">
              <Link href="/sort">Sorter</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/player/aaron-judge">Player Page</Link>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
