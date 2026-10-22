import { describe, expect, it } from "vitest";
import {
  feedbackView,
  formatPeriodDate,
  initialWindow,
  monthFeedbackId,
  monthKey,
  scoreClass,
  shiftWindow,
  timelineMonths,
  toStars,
  windowParams,
} from "./feedback";
import type { TimelineEntry } from "./types";

const entry = (overrides: Partial<TimelineEntry>): TimelineEntry => ({
  period_from: "2026-08-01",
  period_to: "2026-08-31",
  month: 8,
  year: 2026,
  label: "Aug",
  score: 80,
  feedback_id: "CF-1",
  ...overrides,
});

describe("feedbackView", () => {
  it("reads team, and falls back to client", () => {
    expect(feedbackView("team")).toBe("team");
    expect(feedbackView("client")).toBe("client");
    expect(feedbackView("")).toBe("client");
    expect(feedbackView("other")).toBe("client");
  });
});

describe("timeline window", () => {
  it("spans five years either side of the current month", () => {
    expect(initialWindow(new Date(2026, 9, 22))).toEqual({
      start: "2021-10",
      end: "2031-10",
    });
  });

  it("slides both ends by the same months", () => {
    const window = { start: "2021-10", end: "2031-10" };
    expect(shiftWindow(window, -3)).toEqual({
      start: "2021-07",
      end: "2031-07",
    });
    expect(shiftWindow(window, 3)).toEqual({
      start: "2022-01",
      end: "2032-01",
    });
  });

  it("sends the first and last day as from_date and to_date", () => {
    expect(windowParams({ start: "2021-10", end: "2032-02" })).toEqual({
      from_date: "2021-10-01",
      to_date: "2032-02-29",
    });
  });
});

describe("timelineMonths", () => {
  const window = { start: "2026-07", end: "2027-01" };

  it("lists every month of the window with its score", () => {
    const months = timelineMonths(window, [
      entry({ month: 8, score: 44 }),
      entry({ month: 10, score: null, feedback_id: null }),
    ]);
    expect(months.map((month) => month.key)).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
      "2027-01",
    ]);
    expect(months[0]).toEqual({
      key: "2026-07",
      year: 2026,
      month: 6,
      score: null,
      feedbackId: null,
    });
    expect(months[1]).toMatchObject({ score: 44, feedbackId: "CF-1" });
    expect(months[3]).toMatchObject({ score: null, feedbackId: null });
    expect(months[6]).toMatchObject({ year: 2027, month: 0 });
  });

  it("collapses a month's schedules to the first with feedback", () => {
    const entries = [
      entry({ score: null, feedback_id: null }),
      entry({ score: 44, feedback_id: "CF-A" }),
      entry({ score: 94, feedback_id: "CF-B" }),
    ];
    expect(timelineMonths(window, entries)[1]).toMatchObject({
      score: 44,
      feedbackId: "CF-A",
    });
    expect(monthFeedbackId({ year: 2026, month: 7 }, entries)).toBe("CF-A");
  });

  it("finds no feedback for a month without one", () => {
    expect(monthFeedbackId({ year: 2026, month: 8 }, [entry({})])).toBeNull();
    expect(
      monthFeedbackId({ year: 2026, month: 7 }, [entry({ feedback_id: null })]),
    ).toBeNull();
  });
});

describe("scoreClass", () => {
  it("colours by score, and white on the selected pill", () => {
    expect(scoreClass(null, false)).toBe("text-ink-gray-4");
    expect(scoreClass(80, false)).toBe("text-ink-gray-6");
    expect(scoreClass(79, false)).toBe("text-ink-amber-8");
    expect(scoreClass(60, false)).toBe("text-ink-amber-8");
    expect(scoreClass(59, false)).toBe("text-ink-red-8");
    expect(scoreClass(10, true)).toBe("text-ink-base");
  });
});

describe("helpers", () => {
  it("puts a 0–1 rating on the star scale", () => {
    expect(toStars(0.75, 4)).toBe(3);
    expect(toStars(0.625, 4)).toBe(2.5);
    expect(toStars(null, 4)).toBe(0);
  });

  it("formats month keys and period dates", () => {
    expect(monthKey({ year: 2026, month: 0 })).toBe("2026-01");
    expect(formatPeriodDate("2026-09-01")).toBe("Sep 1");
  });
});
