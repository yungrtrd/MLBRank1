import { SituationSplit } from "@/lib/types";

export const situationSplits: SituationSplit[] = [
  {
    id: "ohtani-2023-late-close",
    playerId: "shohei-ohtani",
    season: 2023,
    role: "hitter",
    label: "After the 7th inning, within 2 runs",
    filter: { inningMin: 7, maxRunMargin: 2 },
    sampleSizeLabel: "63 PA",
    stats: { war: 1.8, hr: 7, avg: 0.327, obp: 0.444, slg: 0.712, ops_plus: 201, wrc_plus: 198 },
    sourceMap: { avg: "Public split sample", obp: "Public split sample", slg: "Public split sample", hr: "Public split sample", wrc_plus: "Normalized public split estimate", ops_plus: "Normalized public split estimate", war: "Derived split value proxy" }
  },
  {
    id: "judge-2024-late-close",
    playerId: "aaron-judge",
    season: 2024,
    role: "hitter",
    label: "After the 7th inning, within 2 runs",
    filter: { inningMin: 7, maxRunMargin: 2 },
    sampleSizeLabel: "58 PA",
    stats: { war: 1.6, hr: 8, avg: 0.301, obp: 0.431, slg: 0.689, ops_plus: 193, wrc_plus: 190 },
    sourceMap: { avg: "Public split sample", obp: "Public split sample", slg: "Public split sample", hr: "Public split sample", wrc_plus: "Normalized public split estimate", ops_plus: "Normalized public split estimate", war: "Derived split value proxy" }
  },
  {
    id: "betts-2023-late-close",
    playerId: "mookie-betts",
    season: 2023,
    role: "hitter",
    label: "After the 7th inning, within 2 runs",
    filter: { inningMin: 7, maxRunMargin: 2 },
    sampleSizeLabel: "61 PA",
    stats: { war: 1.2, hr: 4, avg: 0.279, obp: 0.393, slg: 0.541, ops_plus: 156, wrc_plus: 154 },
    sourceMap: { avg: "Public split sample", obp: "Public split sample", slg: "Public split sample", hr: "Public split sample", wrc_plus: "Normalized public split estimate", ops_plus: "Normalized public split estimate", war: "Derived split value proxy" }
  },
  {
    id: "ohtani-2022-high-leverage",
    playerId: "shohei-ohtani",
    season: 2022,
    role: "hitter",
    label: "After the 7th inning, within 2 runs",
    filter: { inningMin: 7, maxRunMargin: 2 },
    sampleSizeLabel: "55 PA",
    stats: { war: 1.1, hr: 5, avg: 0.288, obp: 0.382, slg: 0.596, ops_plus: 172, wrc_plus: 168 },
    sourceMap: { avg: "Public split sample", obp: "Public split sample", slg: "Public split sample", hr: "Public split sample", wrc_plus: "Normalized public split estimate", ops_plus: "Normalized public split estimate", war: "Derived split value proxy" }
  },
  {
    id: "judge-2023-late-close",
    playerId: "aaron-judge",
    season: 2023,
    role: "hitter",
    label: "After the 7th inning, within 2 runs",
    filter: { inningMin: 7, maxRunMargin: 2 },
    sampleSizeLabel: "41 PA",
    stats: { war: 0.8, hr: 4, avg: 0.281, obp: 0.439, slg: 0.625, ops_plus: 184, wrc_plus: 181 },
    sourceMap: { avg: "Public split sample", obp: "Public split sample", slg: "Public split sample", hr: "Public split sample", wrc_plus: "Normalized public split estimate", ops_plus: "Normalized public split estimate", war: "Derived split value proxy" }
  },
  {
    id: "betts-2018-late-close",
    playerId: "mookie-betts",
    season: 2018,
    role: "hitter",
    label: "After the 7th inning, within 2 runs",
    filter: { inningMin: 7, maxRunMargin: 2 },
    sampleSizeLabel: "59 PA",
    stats: { war: 1.5, hr: 6, avg: 0.338, obp: 0.448, slg: 0.677, ops_plus: 192, wrc_plus: 190 },
    sourceMap: { avg: "Public split sample", obp: "Public split sample", slg: "Public split sample", hr: "Public split sample", wrc_plus: "Normalized public split estimate", ops_plus: "Normalized public split estimate", war: "Derived split value proxy" }
  }
];
