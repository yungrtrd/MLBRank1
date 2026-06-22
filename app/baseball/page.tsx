import { PlayerSorter } from "@/components/PlayerSorter";

export const metadata = {
  title: "MLB Ranking | Sports Ranking Hub",
  description: "Rank MLB players through head-to-head choices."
};

export default function BaseballPage() {
  return <PlayerSorter />;
}
