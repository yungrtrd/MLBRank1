import type { Metadata } from "next";

import "@/app/globals.css";

// Site-wide metadata used by Next.js for browser titles and SEO defaults.
export const metadata: Metadata = {
  title: "Sports Ranking Hub",
  description: "Choose between MLB rankings and fantasy football tools."
};

// RootLayout wraps every route in the app and imports the shared CSS once.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
