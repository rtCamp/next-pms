import { describe, expect, it } from "vitest";
import {
  buildScheduleDays,
  buildScheduleDraft,
  formatScheduleRange,
  formatSelectedDates,
  lockedScheduleDates,
  normalizeRange,
  rangeHours,
  seedHoursPerDay,
  toDisplayHours,
} from "./schedule";

describe("toDisplayHours", () => {
  it("rounds to two decimals without trailing zeros", () => {
    expect(toDisplayHours(7.5)).toBe("7.5");
    expect(toDisplayHours(8)).toBe("8");
    expect(toDisplayHours(2.666)).toBe("2.67");
  });
});

describe("normalizeRange", () => {
  it("orders the ends", () => {
    expect(normalizeRange("2026-10-23", "2026-10-19")).toEqual({
      startDate: "2026-10-19",
      endDate: "2026-10-23",
    });
  });
});

describe("rangeHours", () => {
  it("counts weekend days only when the allocation books them", () => {
    // Fri Oct 23 to Mon Oct 26
    expect(rangeHours("2026-10-23", "2026-10-26", 8, true)).toBe(32);
    expect(rangeHours("2026-10-23", "2026-10-26", 8, false)).toBe(16);
  });
});

describe("formatScheduleRange", () => {
  it("formats one day, a month's days and two months", () => {
    expect(formatScheduleRange("2026-10-19")).toBe("Oct 19");
    expect(formatScheduleRange("2026-10-19", "2026-10-23")).toBe("Oct 19 - 23");
    expect(formatScheduleRange("2026-10-30", "2026-11-02")).toBe(
      "Oct 30 - Nov 2",
    );
  });

  it("formats weekdays", () => {
    expect(formatScheduleRange("2026-10-19", "2026-10-23", "day")).toBe(
      "Mon - Fri",
    );
    expect(formatScheduleRange("2026-10-19", "2026-10-19", "day")).toBe("Mon");
  });
});

describe("formatSelectedDates", () => {
  it("collapses consecutive days", () => {
    expect(
      formatSelectedDates([
        "2026-10-23",
        "2026-10-19",
        "2026-10-20",
        "2026-10-21",
      ]),
    ).toBe("Oct 19 - 21, Oct 23");
  });
});

describe("seedHoursPerDay", () => {
  const base = { defaultHoursPerDay: 8, anchorDate: "2026-10-20" };

  it("uses the days' common hours", () => {
    expect(
      seedHoursPerDay({
        ...base,
        dates: ["2026-10-19", "2026-10-20"],
        override: [
          { date: "2026-10-19", hours: 4 },
          { date: "2026-10-20", hours: 4 },
        ],
      }),
    ).toBe(4);
  });

  it("uses the clicked day when they differ, and the default with no day", () => {
    expect(
      seedHoursPerDay({
        ...base,
        dates: ["2026-10-19", "2026-10-20"],
        override: [{ date: "2026-10-20", cancelled: 1 }],
      }),
    ).toBe(0);
    expect(seedHoursPerDay({ ...base, dates: [] })).toBe(8);
  });
});

describe("lockedScheduleDates", () => {
  const availability = {
    "2026-10-20": { availabilityFactor: 0, isHoliday: true },
    "2026-10-21": { availabilityFactor: 0.5, isHoliday: false },
  };

  it("locks full days off and, without weekends, Saturdays and Sundays", () => {
    expect(
      [
        ...lockedScheduleDates(availability, false, {
          startDate: "2026-10-20",
          endDate: "2026-10-25",
          includeWeekends: false,
        }),
      ].sort(),
    ).toEqual(["2026-10-20", "2026-10-24", "2026-10-25"]);
  });

  it("locks no day off when holidays are booked", () => {
    expect(lockedScheduleDates(availability, true).size).toBe(0);
  });
});

describe("buildScheduleDays", () => {
  it("labels days, month starts, days off and locked days", () => {
    const days = buildScheduleDays(
      "2026-10-31",
      "2026-11-02",
      {
        "2026-11-02": {
          availabilityFactor: 0,
          isHoliday: true,
          holidayName: "Fest",
        },
      },
      new Set(["2026-11-01"]),
    );
    expect(days).toEqual([
      {
        date: "2026-10-31",
        dayLabel: "Sat",
        dayNumber: 31,
        monthLabel: "OCT",
        isMonthBoundary: true,
      },
      {
        date: "2026-11-01",
        dayLabel: "Sun",
        dayNumber: 1,
        monthLabel: "NOV",
        isMonthBoundary: true,
        isLocked: true,
      },
      {
        date: "2026-11-02",
        dayLabel: "Mon",
        dayNumber: 2,
        monthLabel: undefined,
        isMonthBoundary: false,
        dayOffTooltip: "Fest",
      },
    ]);
  });
});

describe("buildScheduleDraft", () => {
  const context = {
    rangeStart: "2026-10-19",
    rangeEnd: "2026-10-23",
    defaultHoursPerDay: 8,
    includeWeekends: false,
  };

  it("shows the whole range when nothing is picked", () => {
    const draft = buildScheduleDraft({
      ...context,
      input: { selection: [], value: 8, mode: "hoursPerDay" },
    });
    expect(draft).toMatchObject({
      hasSelection: false,
      hoursPerDay: 8,
      totalHours: 40,
      headerRangeLabel: "Oct 19 - 23",
    });
    expect(draft.previewRows).toEqual([
      {
        startDate: "2026-10-19",
        endDate: "2026-10-23",
        hoursPerDay: 8,
        isSelected: false,
        isModified: false,
      },
    ]);
  });

  it("splits the summary around the picked days", () => {
    const draft = buildScheduleDraft({
      ...context,
      input: {
        selection: ["2026-10-21", "2026-10-20"],
        value: 4,
        mode: "hoursPerDay",
      },
    });
    expect(draft.selection).toEqual(["2026-10-20", "2026-10-21"]);
    expect(draft.totalHours).toBe(8);
    expect(draft.headerRangeLabel).toBe("Oct 20 - 21");
    expect(
      draft.previewRows.map((row) => [
        row.startDate,
        row.endDate,
        row.hoursPerDay,
        row.isModified,
      ]),
    ).toEqual([
      ["2026-10-19", "2026-10-19", 8, false],
      ["2026-10-20", "2026-10-21", 4, true],
      ["2026-10-22", "2026-10-23", 8, false],
    ]);
  });

  it("spreads a typed total over the picked days, a half day off counting half", () => {
    const draft = buildScheduleDraft({
      ...context,
      availability: {
        "2026-10-21": { availabilityFactor: 0.5, isHoliday: false },
      },
      input: {
        selection: [
          "2026-10-19",
          "2026-10-20",
          "2026-10-21",
          "2026-10-22",
          "2026-10-23",
        ],
        value: 27,
        mode: "totalHours",
      },
    });
    expect(draft.hoursPerDay).toBe(6);
    expect(draft.totalHours).toBe(27);
    expect(draft.previewRows.find((row) => row.dayOffLabel)).toMatchObject({
      startDate: "2026-10-21",
      hoursPerDay: 6,
      dayOffLabel: "Half day off",
    });
  });

  it("ignores locked days in the selection", () => {
    const draft = buildScheduleDraft({
      ...context,
      lockedDates: new Set(["2026-10-20"]),
      input: { selection: ["2026-10-20"], value: 4, mode: "hoursPerDay" },
    });
    expect(draft.hasSelection).toBe(false);
  });
});
