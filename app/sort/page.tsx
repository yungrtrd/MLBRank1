import { PlayerSorter } from "@/components/PlayerSorter";

export const metadata = {
  title: "Player Sorter | Baseball Compare Lab",
  description: "Build your own MLB player rankings by choosing winners in head-to-head matchups."
};

export default function SortPage() {
  return <PlayerSorter />;
}
