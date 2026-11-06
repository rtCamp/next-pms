import { describe, expect, it } from "vitest";
import {
  buildSchedulePayload,
  dateKeysInRange,
  type AllocationSchedule,
} from "./overrides";

const week: AllocationSchedule = {
  allocationStartDate: "2026-10-19",
  allocationEndDate: "2026-10-23",
  allocationHoursPerDay: 8,
};

describe("dateKeysInRange", () => {
  it("lists every day, across a month end", () => {
    expect(dateKeysInRange("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });
});

describe("buildSchedulePayload", () => {
  it("changes the hours per day when the whole range is picked", () => {
    expect(
      buildSchedulePayload(
        {
          ...week,
          override: [
            { date: "2026-10-20", hours: 4, source: "Manual" },
            { date: "2026-10-21", cancelled: 1, source: "Leave" },
          ],
        },
        { dates: dateKeysInRange("2026-10-19", "2026-10-23"), hoursPerDay: 6 },
      ),
    ).toEqual({
      allocationHoursPerDay: 6,
      dayOverrides: [],
      deletedDayOverrides: ["2026-10-20"],
    });
  });

  it("counts locked days as covered", () => {
    expect(
      buildSchedulePayload(week, {
        dates: ["2026-10-19", "2026-10-20", "2026-10-22", "2026-10-23"],
        hoursPerDay: 4,
        lockedDates: new Set(["2026-10-21"]),
      }).allocationHoursPerDay,
    ).toBe(4);
  });

  it("overrides the picked days only", () => {
    expect(
      buildSchedulePayload(week, {
        dates: ["2026-10-20", "2026-10-21"],
        hoursPerDay: 0,
      }),
    ).toEqual({
      allocationHoursPerDay: 8,
      dayOverrides: [
        { date: "2026-10-20", cancelled: 1 },
        { date: "2026-10-21", cancelled: 1 },
      ],
      deletedDayOverrides: [],
    });
    expect(
      buildSchedulePayload(week, { dates: ["2026-10-22"], hoursPerDay: 3 })
        .dayOverrides,
    ).toEqual([{ date: "2026-10-22", hours: 3 }]);
  });

  it("drops a manual override going back to the allocation's hours", () => {
    expect(
      buildSchedulePayload(
        { ...week, override: [{ date: "2026-10-20", hours: 4 }] },
        { dates: ["2026-10-20"], hoursPerDay: 8 },
      ),
    ).toEqual({
      allocationHoursPerDay: 8,
      dayOverrides: [],
      deletedDayOverrides: ["2026-10-20"],
    });
  });

  it("writes a leave-owned day back as a manual override instead", () => {
    expect(
      buildSchedulePayload(
        {
          ...week,
          override: [{ date: "2026-10-20", hours: 4, source: "Leave" }],
        },
        { dates: ["2026-10-20"], hoursPerDay: 8 },
      ).dayOverrides,
    ).toEqual([{ date: "2026-10-20", hours: 8 }]);
  });

  it("skips locked days and unchanged days", () => {
    expect(
      buildSchedulePayload(week, {
        dates: ["2026-10-19", "2026-10-20"],
        hoursPerDay: 8,
        lockedDates: new Set(["2026-10-20"]),
      }),
    ).toEqual({
      allocationHoursPerDay: 8,
      dayOverrides: [],
      deletedDayOverrides: [],
    });
  });
});
