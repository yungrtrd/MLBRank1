import { MetricDefinition } from "@/lib/types";

export const metricCatalog: MetricDefinition[] = [
  {
    id: "war",
    label: "WAR",
    category: "advanced",
    roleScope: "both",
    description: "Batting runs + baserunning runs + fielding runs + positional adjustment + league adjustment + replacement runs, converted to wins.",
    sourceLabel: "FanGraphs-style public WAR",
    sourceUrl: "https://www.fangraphs.com",
    format: "decimal",
    betterDirection: "higher"
  },
  {
    id: "ops_plus",
    label: "OPS+",
    category: "advanced",
    roleScope: "hitter",
    description: "100 x (OBP / league OBP + SLG / league SLG - 1), adjusted for park and league context.",
    sourceLabel: "Baseball-Reference style public splits",
    sourceUrl: "https://www.baseball-reference.com",
    format: "integer",
    betterDirection: "higher"
  },
  {
    id: "wrc_plus",
    label: "wRC+",
    category: "advanced",
    roleScope: "hitter",
    description: "(((wRAA / PA) + league R/PA + park adjustment) / league R/PA) x 100.",
    sourceLabel: "FanGraphs public leaderboards",
    sourceUrl: "https://www.fangraphs.com",
    format: "integer",
    betterDirection: "higher"
  },
  {
    id: "hr",
    label: "HR",
    category: "standard",
    roleScope: "hitter",
    description: "Total balls hit fair and out of play in flight, scoring at least one run.",
    sourceLabel: "MLB public stats",
    sourceUrl: "https://www.mlb.com/stats",
    format: "integer",
    betterDirection: "higher"
  },
  {
    id: "avg",
    label: "AVG",
    category: "rate",
    roleScope: "hitter",
    description: "Hits / at-bats.",
    sourceLabel: "MLB public stats",
    sourceUrl: "https://www.mlb.com/stats",
    format: "decimal",
    betterDirection: "higher"
  },
  {
    id: "obp",
    label: "OBP",
    category: "rate",
    roleScope: "hitter",
    description: "(Hits + walks + hit by pitch) / (at-bats + walks + hit by pitch + sacrifice flies).",
    sourceLabel: "MLB public stats",
    sourceUrl: "https://www.mlb.com/stats",
    format: "decimal",
    betterDirection: "higher"
  },
  {
    id: "slg",
    label: "SLG",
    category: "rate",
    roleScope: "hitter",
    description: "Total bases / at-bats.",
    sourceLabel: "MLB public stats",
    sourceUrl: "https://www.mlb.com/stats",
    format: "decimal",
    betterDirection: "higher"
  },
  {
    id: "era",
    label: "ERA",
    category: "rate",
    roleScope: "pitcher",
    description: "(Earned runs x 9) / innings pitched.",
    sourceLabel: "MLB public stats",
    sourceUrl: "https://www.mlb.com/stats/pitching",
    format: "era",
    betterDirection: "lower"
  },
  {
    id: "fip",
    label: "FIP",
    category: "advanced",
    roleScope: "pitcher",
    description: "((13 x HR) + (3 x (BB + HBP)) - (2 x SO)) / IP + constant.",
    sourceLabel: "FanGraphs public leaderboards",
    sourceUrl: "https://www.fangraphs.com",
    format: "decimal",
    betterDirection: "lower"
  },
  {
    id: "era_plus",
    label: "ERA+",
    category: "advanced",
    roleScope: "pitcher",
    description: "100 x (league ERA / pitcher ERA), adjusted for park and league context.",
    sourceLabel: "Baseball-Reference style public splits",
    sourceUrl: "https://www.baseball-reference.com",
    format: "integer",
    betterDirection: "higher"
  },
  {
    id: "ip",
    label: "IP",
    category: "standard",
    roleScope: "pitcher",
    description: "Total outs recorded / 3.",
    sourceLabel: "MLB public stats",
    sourceUrl: "https://www.mlb.com/stats/pitching",
    format: "innings",
    betterDirection: "higher"
  },
  {
    id: "so",
    label: "SO",
    category: "standard",
    roleScope: "pitcher",
    description: "Total batters retired by strikeout.",
    sourceLabel: "MLB public stats",
    sourceUrl: "https://www.mlb.com/stats/pitching",
    format: "integer",
    betterDirection: "higher"
  },
  {
    id: "whip",
    label: "WHIP",
    category: "rate",
    roleScope: "pitcher",
    description: "(Walks + hits allowed) / innings pitched.",
    sourceLabel: "MLB public stats",
    sourceUrl: "https://www.mlb.com/stats/pitching",
    format: "decimal",
    betterDirection: "lower"
  }
];

export function getMetricsForRole(role: "hitter" | "pitcher", requested?: string[]) {
  const eligible = metricCatalog.filter(
    (metric) => metric.roleScope === "both" || metric.roleScope === role
  );

  if (!requested?.length) {
    return eligible;
  }

  return requested
    .map((metricId) => eligible.find((metric) => metric.id === metricId))
    .filter((metric): metric is MetricDefinition => Boolean(metric));
}

export function getMetricById(metricId: string) {
  return metricCatalog.find((metric) => metric.id === metricId);
}
