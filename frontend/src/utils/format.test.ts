import { describe, expect, it } from "vitest";
import {
  floatToTime,
  formatCurrency,
  formatHours,
  formatNumber,
  formatPercentage,
} from "./format";

describe("formatNumber", () => {
  it("keeps at most two decimals", () => {
    expect(formatNumber(1.236)).toBe("1.24");
    expect(formatNumber(1.5)).toBe("1.5");
    expect(formatNumber(2)).toBe("2");
  });

  it("parses numeric strings", () => {
    expect(formatNumber("3.14159")).toBe("3.14");
  });

  it.each([null, undefined, "", "abc", Number.NaN, Infinity])(
    "returns 0 for %s",
    (value) => {
      expect(formatNumber(value as number)).toBe("0");
    },
  );
});

describe("formatHours", () => {
  it("adds the suffix", () => {
    expect(formatHours(1.5)).toBe("1.5h");
    expect(formatHours(null)).toBe("0h");
    expect(formatHours(2, " hrs")).toBe("2 hrs");
  });
});

describe("floatToTime", () => {
  it.each([
    [0, "00:00"],
    [1.5, "01:30"],
    [0.25, "00:15"],
    [10.999, "11:00"],
    [100, "100:00"],
  ])("formats %s as %s", (hours, expected) => {
    expect(floatToTime(hours)).toBe(expected);
  });
});

describe("formatPercentage", () => {
  it("adds a percent sign", () => {
    expect(formatPercentage(12.5)).toBe("12.5%");
    expect(formatPercentage(33.3333)).toBe("33.33%");
    expect(formatPercentage(undefined)).toBe("0%");
  });
});

describe("formatCurrency", () => {
  it("uses the currency's own locale", () => {
    expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50");
    expect(formatCurrency(1234.5, "GBP")).toBe("£1,234.50");
  });

  it("defaults to INR in the Indian format", () => {
    expect(formatCurrency(1234567.5)).toBe("₹12,34,567.50");
  });

  it("treats a missing currency as INR", () => {
    expect(formatCurrency(1234567.5, null)).toBe("₹12,34,567.50");
    expect(formatCurrency(1234567.5, "")).toBe("₹12,34,567.50");
  });

  it("shows no decimals for zero-decimal currencies", () => {
    expect(formatCurrency(1234.56, "JPY")).toMatch(/^[￥¥]1,235$/);
  });

  it("formats unlisted currencies in the Indian format", () => {
    expect(formatCurrency(1234567, "SGD")).toMatch(/^SGD\s12,34,567\.00$/);
  });
});
