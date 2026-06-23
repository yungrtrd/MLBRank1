import { FootballPlayerSorter } from "@/components/FootballPlayerSorter";

// Page metadata is specific to the NFL ranking route.
export const metadata = {
  title: "NFL Player Sorter | Sports Ranking Hub",
  description: "Rank football players by position through head-to-head choices."
};

// FootballSorterPage keeps routing thin and delegates all sorter behavior to the component.
export default function FootballSorterPage() {
  return <FootballPlayerSorter />;
}
