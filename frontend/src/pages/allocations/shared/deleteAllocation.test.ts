import { describe, expect, it } from "vitest";
import { deleteMessage, deleteSummary } from "./deleteAllocation";

const data = {
  projectName: "Atlas",
  // Fri Oct 23 to Mon Oct 26
  segmentStartDate: new Date(2026, 9, 23),
  segmentEndDate: new Date(2026, 9, 26),
  segmentHoursPerDay: 4,
};

describe("deleteSummary", () => {
  it("counts only the days a weekends-off allocation books", () => {
    expect(deleteSummary(data)).toEqual({
      projectName: "Atlas",
      dateRange: "Oct 23, 2026 – Oct 26, 2026",
      hoursPerDay: "4h/day",
      totalHours: "8 hours",
    });
    expect(deleteSummary({ ...data, includeWeekends: true }).totalHours).toBe(
      "16 hours",
    );
  });

  it("keeps the card's own labels, replacing only the total", () => {
    expect(
      deleteSummary(data, {
        projectName: "Atlas Portal",
        dateRange: "card range",
        hoursPerDay: "4h/day",
        totalHours: "16 hours",
      }),
    ).toEqual({
      projectName: "Atlas Portal",
      dateRange: "card range",
      hoursPerDay: "4h/day",
      totalHours: "8 hours",
    });
  });
});

describe("deleteMessage", () => {
  it("asks about the allocation", () => {
    expect(deleteMessage(deleteSummary(data))).toBe(
      'Are you sure you want to delete "Atlas" (Oct 23, 2026 – Oct 26, 2026, 4h/day, 8 hours)? This cannot be undone.',
    );
  });
});
