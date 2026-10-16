import { describe, expect, it } from "vitest";
import {
  clampHours,
  formatHoursBalance,
  getNotchOffsets,
  getPreviewMinutes,
  getSliderHours,
  normalizeCommittedHours,
  sanitizeHoursInput,
  snapToSliderStep,
  timeToFloat,
} from "./utils";

describe("timeToFloat", () => {
  it.each([
    ["1.5", 1.5],
    [".5", 0.5],
    ["2.", 2],
    [" 3 ", 3],
    ["5:30", 5.5],
    ["5:3", 5.05],
    [":30", 0.5],
    ["5:", 5],
    ["1:75", 2.25],
    [":", 0],
    ["", 0],
    ["abc", 0],
    ["1.5.2", 0],
    ["1:2:3", 0],
  ])("parses %j as %d", (value, hours) => {
    expect(timeToFloat(value)).toBeCloseTo(hours);
  });
});

describe("clampHours", () => {
  it("keeps hours between 0 and the max", () => {
    expect(clampHours(-1, 8)).toBe(0);
    expect(clampHours(5, 8)).toBe(5);
    expect(clampHours(10, 8)).toBe(8);
  });
});

describe("snapToSliderStep", () => {
  it("rounds to the nearest 30 minutes", () => {
    expect(snapToSliderStep(14)).toBe(0);
    expect(snapToSliderStep(15)).toBe(30);
    expect(snapToSliderStep(44)).toBe(30);
    expect(snapToSliderStep(50)).toBe(60);
  });
});

describe("getPreviewMinutes", () => {
  it("snaps only in smooth mode", () => {
    expect(getPreviewMinutes(50, "smooth")).toBe(60);
    expect(getPreviewMinutes(50, "step")).toBe(50);
  });
});

describe("getSliderHours", () => {
  it("returns the previewed hours, capped at the max", () => {
    expect(getSliderHours(50, "smooth", 8)).toBe(1);
    expect(getSliderHours(600, "step", 8)).toBe(8);
  });
});

describe("normalizeCommittedHours", () => {
  it("clamps unless overflow is allowed", () => {
    expect(normalizeCommittedHours(10, 8, false)).toBe(8);
    expect(normalizeCommittedHours(10, 8, true)).toBe(10);
    expect(normalizeCommittedHours(-2, 8, true)).toBe(0);
  });
});

describe("sanitizeHoursInput", () => {
  it.each([
    ["1h 30m", "130"],
    ["1.5", "1.5"],
    ["1.2.3", "1.23"],
    ["1:30", "1:30"],
    ["1:3:0", "1:30"],
    ["1.5:30", "15:30"],
    [":", ":"],
    ["abc", ""],
  ])("turns %j into %j", (value, expected) => {
    expect(sanitizeHoursInput(value)).toBe(expected);
  });
});

describe("formatHoursBalance", () => {
  it.each([
    [0, "0h"],
    [1 / 6, "10m"],
    [1.5, "1h 30m"],
    [8, "8h"],
    [0.999, "1h"],
  ])("formats %d as %s", (hours, expected) => {
    expect(formatHoursBalance(hours)).toBe(expected);
  });
});

describe("getNotchOffsets", () => {
  it("places a notch between each step, centred on it", () => {
    expect(getNotchOffsets(120)).toEqual([24.5, 49.5, 74.5]);
  });

  it("returns no notches for a single step or less", () => {
    expect(getNotchOffsets(30)).toEqual([]);
    expect(getNotchOffsets(0)).toEqual([]);
  });
});
