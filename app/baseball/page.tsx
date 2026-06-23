import { PlayerSorter } from "@/components/PlayerSorter";

// Page metadata is specific to the MLB ranking route.
export const metadata = {
  title: "MLB Ranking | Sports Ranking Hub",
  description: "Rank MLB players through head-to-head choices."
};

// BaseballPage keeps routing thin and delegates all sorter behavior to PlayerSorter.
export default function BaseballPage() {
  return <PlayerSorter />;
}
