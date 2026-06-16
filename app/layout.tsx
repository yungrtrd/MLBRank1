import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Baseball Player Sorter",
  description: "Rank baseball players through head-to-head choices using Sports Reference stats."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
