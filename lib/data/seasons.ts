import { PlayerSeason } from "@/lib/types";

export const seasons: PlayerSeason[] = [
  {
    id: "ohtani-2021-h",
    playerId: "shohei-ohtani",
    season: 2021,
    team: "LAA",
    role: "hitter",
    stats: { war: 8.1, hr: 46, avg: 0.257, obp: 0.372, slg: 0.592, ops_plus: 158, wrc_plus: 152 },
    sourceMap: { war: "FanGraphs", hr: "MLB", avg: "MLB", obp: "MLB", slg: "MLB", ops_plus: "Baseball-Reference", wrc_plus: "FanGraphs" }
  },
  {
    id: "ohtani-2022-h",
    playerId: "shohei-ohtani",
    season: 2022,
    team: "LAA",
    role: "hitter",
    stats: { war: 6.2, hr: 34, avg: 0.273, obp: 0.356, slg: 0.519, ops_plus: 145, wrc_plus: 142 },
    sourceMap: { war: "FanGraphs", hr: "MLB", avg: "MLB", obp: "MLB", slg: "MLB", ops_plus: "Baseball-Reference", wrc_plus: "FanGraphs" }
  },
  {
    id: "ohtani-2023-h",
    playerId: "shohei-ohtani",
    season: 2023,
    team: "LAA",
    role: "hitter",
    stats: { war: 10, hr: 44, avg: 0.304, obp: 0.412, slg: 0.654, ops_plus: 184, wrc_plus: 180 },
    sourceMap: { war: "FanGraphs", hr: "MLB", avg: "MLB", obp: "MLB", slg: "MLB", ops_plus: "Baseball-Reference", wrc_plus: "FanGraphs" }
  },
  {
    id: "judge-2022-h",
    playerId: "aaron-judge",
    season: 2022,
    team: "NYY",
    role: "hitter",
    stats: { war: 11.5, hr: 62, avg: 0.311, obp: 0.425, slg: 0.686, ops_plus: 211, wrc_plus: 207 },
    sourceMap: { war: "FanGraphs", hr: "MLB", avg: "MLB", obp: "MLB", slg: "MLB", ops_plus: "Baseball-Reference", wrc_plus: "FanGraphs" }
  },
  {
    id: "judge-2023-h",
    playerId: "aaron-judge",
    season: 2023,
    team: "NYY",
    role: "hitter",
    stats: { war: 4.5, hr: 37, avg: 0.267, obp: 0.406, slg: 0.613, ops_plus: 175, wrc_plus: 174 },
    sourceMap: { war: "FanGraphs", hr: "MLB", avg: "MLB", obp: "MLB", slg: "MLB", ops_plus: "Baseball-Reference", wrc_plus: "FanGraphs" }
  },
  {
    id: "judge-2024-h",
    playerId: "aaron-judge",
    season: 2024,
    team: "NYY",
    role: "hitter",
    stats: { war: 10.8, hr: 58, avg: 0.322, obp: 0.458, slg: 0.701, ops_plus: 223, wrc_plus: 218 },
    sourceMap: { war: "FanGraphs", hr: "MLB", avg: "MLB", obp: "MLB", slg: "MLB", ops_plus: "Baseball-Reference", wrc_plus: "FanGraphs" }
  },
  {
    id: "betts-2018-h",
    playerId: "mookie-betts",
    season: 2018,
    team: "BOS",
    role: "hitter",
    stats: { war: 10.4, hr: 32, avg: 0.346, obp: 0.438, slg: 0.64, ops_plus: 185, wrc_plus: 185 },
    sourceMap: { war: "FanGraphs", hr: "MLB", avg: "MLB", obp: "MLB", slg: "MLB", ops_plus: "Baseball-Reference", wrc_plus: "FanGraphs" }
  },
  {
    id: "betts-2020-h",
    playerId: "mookie-betts",
    season: 2020,
    team: "LAD",
    role: "hitter",
    stats: { war: 3.4, hr: 16, avg: 0.292, obp: 0.366, slg: 0.562, ops_plus: 149, wrc_plus: 149 },
    sourceMap: { war: "FanGraphs", hr: "MLB", avg: "MLB", obp: "MLB", slg: "MLB", ops_plus: "Baseball-Reference", wrc_plus: "FanGraphs" }
  },
  {
    id: "betts-2023-h",
    playerId: "mookie-betts",
    season: 2023,
    team: "LAD",
    role: "hitter",
    stats: { war: 8.3, hr: 39, avg: 0.307, obp: 0.408, slg: 0.579, ops_plus: 167, wrc_plus: 167 },
    sourceMap: { war: "FanGraphs", hr: "MLB", avg: "MLB", obp: "MLB", slg: "MLB", ops_plus: "Baseball-Reference", wrc_plus: "FanGraphs" }
  },
  {
    id: "degrom-2018-p",
    playerId: "jacob-degrom",
    season: 2018,
    team: "NYM",
    role: "pitcher",
    stats: { war: 9.0, era: 1.7, fip: 1.99, era_plus: 218, ip: 217, so: 269, whip: 0.912 },
    sourceMap: { war: "FanGraphs", era: "MLB", fip: "FanGraphs", era_plus: "Baseball-Reference", ip: "MLB", so: "MLB", whip: "MLB" }
  },
  {
    id: "degrom-2019-p",
    playerId: "jacob-degrom",
    season: 2019,
    team: "NYM",
    role: "pitcher",
    stats: { war: 7.2, era: 2.43, fip: 2.67, era_plus: 169, ip: 204, so: 255, whip: 0.971 },
    sourceMap: { war: "FanGraphs", era: "MLB", fip: "FanGraphs", era_plus: "Baseball-Reference", ip: "MLB", so: "MLB", whip: "MLB" }
  },
  {
    id: "degrom-2021-p",
    playerId: "jacob-degrom",
    season: 2021,
    team: "NYM",
    role: "pitcher",
    stats: { war: 5.3, era: 1.08, fip: 1.24, era_plus: 373, ip: 92, so: 146, whip: 0.554 },
    sourceMap: { war: "FanGraphs", era: "MLB", fip: "FanGraphs", era_plus: "Baseball-Reference", ip: "MLB", so: "MLB", whip: "MLB" }
  },
  {
    id: "cole-2019-p",
    playerId: "gerrit-cole",
    season: 2019,
    team: "HOU",
    role: "pitcher",
    stats: { war: 7.5, era: 2.5, fip: 2.64, era_plus: 185, ip: 212.1, so: 326, whip: 0.895 },
    sourceMap: { war: "FanGraphs", era: "MLB", fip: "FanGraphs", era_plus: "Baseball-Reference", ip: "MLB", so: "MLB", whip: "MLB" }
  },
  {
    id: "cole-2021-p",
    playerId: "gerrit-cole",
    season: 2021,
    team: "NYY",
    role: "pitcher",
    stats: { war: 5.3, era: 3.23, fip: 3.47, era_plus: 133, ip: 181.1, so: 243, whip: 1.059 },
    sourceMap: { war: "FanGraphs", era: "MLB", fip: "FanGraphs", era_plus: "Baseball-Reference", ip: "MLB", so: "MLB", whip: "MLB" }
  },
  {
    id: "cole-2023-p",
    playerId: "gerrit-cole",
    season: 2023,
    team: "NYY",
    role: "pitcher",
    stats: { war: 5.2, era: 2.63, fip: 3.16, era_plus: 165, ip: 209, so: 222, whip: 0.981 },
    sourceMap: { war: "FanGraphs", era: "MLB", fip: "FanGraphs", era_plus: "Baseball-Reference", ip: "MLB", so: "MLB", whip: "MLB" }
  },
  {
    id: "kershaw-2014-p",
    playerId: "clayton-kershaw",
    season: 2014,
    team: "LAD",
    role: "pitcher",
    stats: { war: 7.7, era: 1.77, fip: 1.81, era_plus: 197, ip: 198.1, so: 239, whip: 0.857 },
    sourceMap: { war: "FanGraphs", era: "MLB", fip: "FanGraphs", era_plus: "Baseball-Reference", ip: "MLB", so: "MLB", whip: "MLB" }
  },
  {
    id: "kershaw-2016-p",
    playerId: "clayton-kershaw",
    season: 2016,
    team: "LAD",
    role: "pitcher",
    stats: { war: 6.1, era: 1.69, fip: 1.8, era_plus: 237, ip: 149, so: 172, whip: 0.725 },
    sourceMap: { war: "FanGraphs", era: "MLB", fip: "FanGraphs", era_plus: "Baseball-Reference", ip: "MLB", so: "MLB", whip: "MLB" }
  },
  {
    id: "kershaw-2023-p",
    playerId: "clayton-kershaw",
    season: 2023,
    team: "LAD",
    role: "pitcher",
    stats: { war: 3.2, era: 2.46, fip: 3.72, era_plus: 163, ip: 131.2, so: 137, whip: 1.063 },
    sourceMap: { war: "FanGraphs", era: "MLB", fip: "FanGraphs", era_plus: "Baseball-Reference", ip: "MLB", so: "MLB", whip: "MLB" }
  }
];
