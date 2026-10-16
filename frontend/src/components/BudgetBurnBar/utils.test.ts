import { describe, expect, it } from "vitest";
import { budgetBurnTier, scale } from "./utils";

describe("scale", () => {
  it("returns the value as a percentage of max", () => {
    expect(scale(25, 200)).toBe(12.5);
  });

  it("caps at 0 and 100", () => {
    expect(scale(300, 200)).toBe(100);
    expect(scale(-5, 200)).toBe(0);
  });

  it("returns 0 when max is 0 or less", () => {
    expect(scale(10, 0)).toBe(0);
    expect(scale(10, -1)).toBe(0);
  });
});

describe("budgetBurnTier", () => {
  it.each([
    [0, "healthy"],
    [59.9, "healthy"],
    [60, "moderate"],
    [80, "moderate"],
    [80.1, "over"],
    [150, "over"],
  ])("puts %d%% in %s", (percent, tier) => {
    expect(budgetBurnTier(percent)).toBe(tier);
  });
});
