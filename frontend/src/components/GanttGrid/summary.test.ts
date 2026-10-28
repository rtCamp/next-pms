import { describe, expect, it } from "vitest";
import {
  allocationSummary,
  capacityStatus,
  coveredDays,
  editableHoursPerDay,
  employeeSummary,
  formatHours,
  freeCapacitySegments,
  projectSummarySegments,
  timeoffLabel,
} from "./summary";
import type { Allocation } from "./types";

const day = (date: number, month = 9) => new Date(2026, month, date);
const allocation = (
  start: number,
  end: number,
  hours: number,
  extra: Partial<Allocation> = {},
): Allocation => ({
  startDate: day(start),
  endDate: day(end),
  hours,
  ...extra,
});
const range = (segment: { startDate: Date; endDate: Date }) => [
  segment.startDate.getDate(),
  segment.endDate.getDate(),
];

describe("formatHours", () => {
  it("keeps up to two decimals without trailing zeros", () => {
    expect(formatHours(8)).toBe("8");
    expect(formatHours(7.5)).toBe("7.5");
    expect(formatHours(1 / 3)).toBe("0.33");
  });
});

describe("capacityStatus", () => {
  it("is full at capacity", () => {
    expect(capacityStatus(8)).toEqual({ variant: "full", label: "Full" });
    expect(capacityStatus(6, 6)).toEqual({ variant: "full", label: "Full" });
  });

  it("reports free and over hours against 8h by default", () => {
    expect(capacityStatus(5.5)).toEqual({
      variant: "under",
      label: "2.5h free",
    });
    expect(capacityStatus(10)).toEqual({ variant: "over", label: "2h over" });
    expect(capacityStatus(0, 6)).toEqual({
      variant: "under",
      label: "6h free",
    });
  });

  it("ignores floating-point noise", () => {
    expect(capacityStatus(0.1 + 0.2 + 7.7)).toEqual({
      variant: "full",
      label: "Full",
    });
  });
});

describe("timeoffLabel", () => {
  it("counts days or names the half", () => {
    expect(timeoffLabel(day(19), day(19))).toBe("1 day off");
    expect(timeoffLabel(day(19), day(23))).toBe("5 days off");
    expect(timeoffLabel(day(19), day(19), "first")).toBe("First half off");
    expect(timeoffLabel(day(19), day(19), "second")).toBe("Second half off");
    expect(timeoffLabel(day(19), day(19), "half")).toBe("Half day off");
  });
});

describe("editableHoursPerDay", () => {
  it("falls back to the allocation's hours for a zero-hour placeholder", () => {
    expect(editableHoursPerDay(allocation(19, 23, 4))).toBe(4);
    expect(
      editableHoursPerDay(
        allocation(19, 23, 0, { fullyReduced: true, allocationHoursPerDay: 6 }),
      ),
    ).toBe(6);
  });
});

describe("allocationSummary", () => {
  it("adds up overlapping allocations into runs", () => {
    const segments = allocationSummary([
      allocation(19, 23, 4),
      allocation(21, 22, 4),
    ]);
    expect(segments.map(range)).toEqual([
      [19, 20],
      [21, 22],
      [23, 23],
    ]);
    expect(segments.map((segment) => segment.hours)).toEqual([4, 8, 4]);
    expect(segments.every((segment) => segment.type === "default")).toBe(true);
  });

  it("splits runs on billable, tentative and AI flags", () => {
    const segments = allocationSummary([
      allocation(19, 19, 8),
      allocation(20, 20, 8, { billable: false }),
      allocation(21, 21, 8, { tentative: true }),
      allocation(22, 22, 8, { isAiCreated: true }),
    ]);
    expect(segments).toHaveLength(4);
    expect(segments[1].billable).toBe(false);
    expect(segments[2].tentative).toBe(true);
    expect(segments[3].isAiCreated).toBe(true);
  });

  it("keeps the days of a zero-hour placeholder free", () => {
    expect(
      allocationSummary([allocation(19, 23, 0, { fullyReduced: true })]),
    ).toEqual([]);
  });

  it("marks leave, half days and holidays", () => {
    const segments = allocationSummary(
      [allocation(19, 23, 8)],
      [
        {
          startDate: day(21),
          endDate: day(22),
          halfDayDate: day(22),
          halfDayPortion: "second",
        },
        { startDate: day(23), endDate: day(23), label: "Diwali" },
      ],
    );
    expect(
      segments.map((segment) => [
        ...range(segment),
        segment.type,
        segment.timeoff,
        segment.label,
      ]),
    ).toEqual([
      [19, 20, "default", undefined, undefined],
      [21, 21, "timeoff", "full", undefined],
      [22, 22, "timeoff", "second", undefined],
      [23, 23, "timeoff", "full", "Diwali"],
    ]);
  });

  it("lets a full day of leave win over a half day on the same day", () => {
    const [segment] = allocationSummary(
      [],
      [
        { startDate: day(19), endDate: day(19), halfDayDate: day(19) },
        { startDate: day(19), endDate: day(19) },
      ],
    );
    expect(segment.timeoff).toBe("full");
  });

  it("breaks runs at gaps", () => {
    const segments = allocationSummary([
      allocation(19, 20, 8),
      allocation(22, 23, 8),
    ]);
    expect(segments.map(range)).toEqual([
      [19, 20],
      [22, 23],
    ]);
  });
});

describe("employeeSummary", () => {
  it("merges allocations across projects", () => {
    const segments = employeeSummary(
      [
        { allocations: [allocation(19, 20, 4)] },
        { allocations: [allocation(19, 20, 4)] },
        {},
      ],
      [],
    );
    expect(segments).toHaveLength(1);
    expect(segments[0].hours).toBe(8);
  });
});

describe("freeCapacitySegments", () => {
  it("lists the uncovered weekdays as runs", () => {
    const covered = coveredDays(allocationSummary([allocation(21, 21, 8)]));
    const free = freeCapacitySegments(covered, day(19), day(1, 10));
    expect(free.map(range)).toEqual([
      [19, 20],
      [22, 23],
      [26, 30],
    ]);
    expect(free.every((segment) => segment.type === "free")).toBe(true);
  });

  it("is empty for an inverted range", () => {
    expect(freeCapacitySegments(new Set(), day(20), day(19))).toEqual([]);
  });
});

describe("projectSummarySegments", () => {
  it("totals each run of weekdays with the same daily hours", () => {
    const segments = projectSummarySegments([
      allocation(19, 30, 8),
      allocation(19, 23, 4, { tentative: true }),
    ]);
    expect(
      segments.map((segment) => [
        ...range(segment),
        segment.hours,
        segment.tentative,
      ]),
    ).toEqual([
      [19, 23, 60, true],
      [26, 30, 40, false],
    ]);
  });

  it("splits a week where the daily total changes", () => {
    const segments = projectSummarySegments([
      allocation(19, 20, 8),
      allocation(21, 23, 4),
    ]);
    expect(segments.map((segment) => segment.hours)).toEqual([16, 12]);
  });

  it("leaves out weekend days", () => {
    const segments = projectSummarySegments([allocation(24, 25, 8)]);
    expect(segments).toEqual([]);
  });

  it("marks AI-created runs", () => {
    const [segment] = projectSummarySegments([
      allocation(19, 19, 8, { isAiCreated: true }),
    ]);
    expect(segment.isAiCreated).toBe(true);
  });
});
