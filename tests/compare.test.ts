import { describe, expect, it } from "vitest";

import { buildComparison } from "@/lib/compare";

describe("buildComparison", () => {
  it("builds hitter season comparisons with requested metrics", () => {
    const response = buildComparison({
      playerIds: ["shohei-ohtani", "aaron-judge"],
      role: "hitter",
      mode: "season",
      metrics: ["war", "hr", "wrc_plus"]
    });

    expect(response.role).toBe("hitter");
    expect(response.metrics.map((metric) => metric.id)).toEqual(["war", "hr", "wrc_plus"]);
    expect(response.players).toHaveLength(2);
    expect(response.players[0].rows[0]?.stats).toHaveProperty("war");
  });

  it("builds pitcher career comparisons with a peak window row", () => {
    const response = buildComparison({
      playerIds: ["jacob-degrom", "clayton-kershaw"],
      role: "pitcher",
      mode: "career"
    });

    expect(response.players[0].rows.map((row) => row.label)).toContain("Career");
    expect(response.players[0].rows).toHaveLength(2);
    expect(response.players[1].summary.peakWindow.years.length).toBeGreaterThan(0);
  });

  it("builds situational hitter comparisons for late-and-close season splits", () => {
    const response = buildComparison({
      playerIds: ["shohei-ohtani", "aaron-judge"],
      role: "hitter",
      mode: "season",
      startYear: 2023,
      endYear: 2024,
      situation: {
        inningMin: 7,
        maxRunMargin: 2
      },
      metrics: ["avg", "obp", "slg", "wrc_plus"]
    });

    expect(response.scope).toBe("situation");
    expect(response.situationLabel).toContain("after the 7th inning");
    expect(response.players[0].rows[0]?.label).toContain("within 2 runs");
  });
});
