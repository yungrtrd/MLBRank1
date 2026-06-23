import { FantasyFootballDashboard } from "@/components/FantasyFootballDashboard";

// Page metadata is specific to the fantasy football dashboard route.
export const metadata = {
  title: "Fantasy Football | Sports Ranking Hub",
  description: "Fantasy football rankings and tools."
};

// This route is hidden from the home page for now, but the dashboard still works directly.
export default function FantasyFootballPage() {
  return <FantasyFootballDashboard />;
}
