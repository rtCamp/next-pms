import { describe, expect, it } from "vitest";
import { isPriorityLevel, priorityBars } from "./priority";

describe("priorityBars", () => {
  it.each([
    ["Low", 1],
    ["Medium", 2],
    ["High", 3],
  ])("fills %s with %d bars", (level, bars) => {
    expect(priorityBars(level)).toBe(bars);
  });

  it("fills all three bars for a level outside the scale", () => {
    expect(priorityBars("Critical")).toBe(3);
    expect(priorityBars("")).toBe(3);
  });
});

describe("isPriorityLevel", () => {
  it("knows the three levels only", () => {
    expect(isPriorityLevel("Medium")).toBe(true);
    expect(isPriorityLevel("medium")).toBe(false);
    expect(isPriorityLevel(null)).toBe(false);
  });
});
