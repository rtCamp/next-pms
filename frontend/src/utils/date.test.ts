import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatProjectDate,
  getRangeLabel,
  getVisibleDays,
  getWeekStart,
} from "./date";

afterEach(() => vi.useRealTimers());

describe("getWeekStart", () => {
  it("returns the Monday of the week at midnight", () => {
    // Thursday
    expect(getWeekStart(new Date(2026, 9, 15, 14, 30))).toEqual(
      new Date(2026, 9, 12),
    );
  });

  it("keeps a Monday and counts Sunday as the end of the week", () => {
    expect(getWeekStart(new Date(2026, 9, 12, 9))).toEqual(
      new Date(2026, 9, 12),
    );
    expect(getWeekStart(new Date(2026, 9, 18, 23))).toEqual(
      new Date(2026, 9, 12),
    );
  });

  it("crosses a month boundary", () => {
    expect(getWeekStart(new Date(2026, 10, 1))).toEqual(new Date(2026, 9, 26));
  });
});

describe("getVisibleDays", () => {
  it("returns consecutive days from the start", () => {
    expect(getVisibleDays(new Date(2026, 11, 30), 4)).toEqual([
      new Date(2026, 11, 30),
      new Date(2026, 11, 31),
      new Date(2027, 0, 1),
      new Date(2027, 0, 2),
    ]);
  });

  it("returns nothing for zero days", () => {
    expect(getVisibleDays(new Date(2026, 0, 1), 0)).toEqual([]);
  });
});

describe("getRangeLabel", () => {
  it("shows the year once when the range stays in one year", () => {
    expect(getRangeLabel(new Date(2026, 9, 12), 14)).toBe(
      "Oct 12 - Oct 25, 2026",
    );
  });

  it("shows both years when the range crosses into the next", () => {
    expect(getRangeLabel(new Date(2026, 11, 28), 7)).toBe(
      "Dec 28, 2026 - Jan 3, 2027",
    );
  });
});

describe("formatProjectDate", () => {
  it("leaves out the current year", () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 16), toFake: ["Date"] });
    expect(formatProjectDate("2026-10-15")).toBe("Oct 15");
  });

  it("shows another year", () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 16), toFake: ["Date"] });
    expect(formatProjectDate("2025-03-02")).toBe("Mar 2, 2025");
  });
});
