import { describe, expect, it } from "vitest";
import {
  formatISODate,
  parseAnchorDate,
  parseDuration,
  parseISODate,
  shiftAnchorDate,
} from "./dateWindow";

describe("parseISODate", () => {
  it("reads a YYYY-MM-DD date at local midnight", () => {
    expect(parseISODate("2026-10-22")).toEqual(new Date(2026, 9, 22));
  });

  it("rejects other formats and impossible dates", () => {
    expect(parseISODate("")).toBeNull();
    expect(parseISODate(null)).toBeNull();
    expect(parseISODate("22-10-2026")).toBeNull();
    expect(parseISODate("2026-02-30")).toBeNull();
    expect(parseISODate("2026-10-22T10:00")).toBeNull();
  });
});

describe("formatISODate", () => {
  it("writes a date as YYYY-MM-DD", () => {
    expect(formatISODate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("parseDuration", () => {
  it("keeps the known durations", () => {
    expect(parseDuration("this-week")).toBe("this-week");
    expect(parseDuration("this-month")).toBe("this-month");
  });

  it("falls back to this quarter", () => {
    expect(parseDuration("")).toBe("this-quarter");
    expect(parseDuration("next-year")).toBe("this-quarter");
    expect(parseDuration("toString")).toBe("this-quarter");
  });
});

describe("parseAnchorDate", () => {
  const today = new Date(2026, 9, 22, 15, 30);

  it("reads the date param", () => {
    expect(parseAnchorDate("2026-03-02", today)).toEqual(new Date(2026, 2, 2));
  });

  it("uses today when the param is missing or invalid", () => {
    expect(parseAnchorDate("", today)).toEqual(new Date(2026, 9, 22));
    expect(parseAnchorDate("soon", today)).toEqual(new Date(2026, 9, 22));
  });
});

describe("shiftAnchorDate", () => {
  const anchor = new Date(2026, 9, 22);

  it("moves a week window by one week", () => {
    expect(shiftAnchorDate(anchor, "this-week", 1)).toEqual(
      new Date(2026, 9, 29),
    );
    expect(shiftAnchorDate(anchor, "this-week", -1)).toEqual(
      new Date(2026, 9, 15),
    );
  });

  it("moves a month window by four weeks", () => {
    expect(shiftAnchorDate(anchor, "this-month", 1)).toEqual(
      new Date(2026, 10, 19),
    );
  });

  it("moves a quarter window by thirteen weeks", () => {
    expect(shiftAnchorDate(anchor, "this-quarter", -1)).toEqual(
      new Date(2026, 6, 23),
    );
  });
});
