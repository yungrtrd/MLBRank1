import { Player } from "@/lib/types";

export const players: Player[] = [
  {
    id: "shohei-ohtani",
    slug: "shohei-ohtani",
    fullName: "Shohei Ohtani",
    primaryRole: "two-way",
    bats: "L",
    throws: "R",
    teams: ["LAA", "LAD"],
    debutYear: 2018,
    lastYear: 2025,
    aliases: ["Ohtani", "Shotime"],
    bio: "Two-way superstar with elite power, patience, speed, and top-end pitching seasons."
  },
  {
    id: "aaron-judge",
    slug: "aaron-judge",
    fullName: "Aaron Judge",
    primaryRole: "hitter",
    bats: "R",
    throws: "R",
    teams: ["NYY"],
    debutYear: 2016,
    lastYear: 2025,
    aliases: ["Judge", "All Rise"],
    bio: "Right-handed slugger known for historic power output and elite on-base damage."
  },
  {
    id: "mookie-betts",
    slug: "mookie-betts",
    fullName: "Mookie Betts",
    primaryRole: "hitter",
    bats: "R",
    throws: "R",
    teams: ["BOS", "LAD"],
    debutYear: 2014,
    lastYear: 2025,
    aliases: ["Betts"],
    bio: "Complete superstar combining contact, power, plate discipline, baserunning, and defense."
  },
  {
    id: "jacob-degrom",
    slug: "jacob-degrom",
    fullName: "Jacob deGrom",
    primaryRole: "pitcher",
    bats: "L",
    throws: "R",
    teams: ["NYM", "TEX"],
    debutYear: 2014,
    lastYear: 2025,
    aliases: ["deGrom", "Degrom"],
    bio: "Dominant ace with elite strikeout rates and run prevention at his peak."
  },
  {
    id: "gerrit-cole",
    slug: "gerrit-cole",
    fullName: "Gerrit Cole",
    primaryRole: "pitcher",
    bats: "R",
    throws: "R",
    teams: ["PIT", "HOU", "NYY"],
    debutYear: 2013,
    lastYear: 2025,
    aliases: ["Cole"],
    bio: "High-volume frontline starter with elite strikeouts and long-run durability."
  },
  {
    id: "clayton-kershaw",
    slug: "clayton-kershaw",
    fullName: "Clayton Kershaw",
    primaryRole: "pitcher",
    bats: "L",
    throws: "L",
    teams: ["LAD"],
    debutYear: 2008,
    lastYear: 2025,
    hallOfFame: true,
    aliases: ["Kershaw"],
    bio: "Generational left-handed ace with one of the strongest run-prevention peaks in modern MLB."
  }
];
