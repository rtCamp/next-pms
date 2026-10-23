import { describe, expect, it } from "vitest";
import {
  dayHours,
  indexCustomers,
  isLeaveOwnedOverride,
  mapAllocation,
  mapAllocationSegments,
  parseFrappeDatetime,
  reducingFactor,
} from "./segments";
import type { AllocationRecord } from "./types";

function record(overrides: Partial<AllocationRecord> = {}): AllocationRecord {
  return {
    name: "RA-1",
    employee: "EMP-1",
    project: "PROJ-1",
    hours_allocated_per_day: 8,
    total_allocated_hours: 40,
    allocation_start_date: "2026-10-19",
    allocation_end_date: "2026-10-23",
    is_billable: 1,
    status: "Confirmed",
    ...overrides,
  };
}

describe("parseFrappeDatetime", () => {
  it("reads a datetime with microseconds", () => {
    expect(parseFrappeDatetime("2026-10-19 14:05:09.123456")).toEqual(
      new Date(2026, 9, 19, 14, 5, 9, 123),
    );
  });
});

describe("isLeaveOwnedOverride", () => {
  it("is true only for rows the leave sync wrote", () => {
    expect(isLeaveOwnedOverride({ date: "2026-10-19", source: "Leave" })).toBe(
      true,
    );
    expect(isLeaveOwnedOverride({ date: "2026-10-19", source: "Manual" })).toBe(
      false,
    );
    expect(isLeaveOwnedOverride({ date: "2026-10-19" })).toBe(false);
  });
});

describe("reducingFactor", () => {
  const halfDay = { availabilityFactor: 0.5, isHoliday: false };

  it("books a full day without a day off or when holidays are included", () => {
    expect(reducingFactor(undefined, false)).toBe(1);
    expect(reducingFactor(halfDay, true)).toBe(1);
  });

  it("books the available share of a day off", () => {
    expect(reducingFactor(halfDay, false)).toBe(0.5);
  });
});

describe("dayHours", () => {
  it("reads a cancelled day as zero and an override's hours before the default", () => {
    expect(dayHours({ date: "x", cancelled: 1, hours: 3 }, 8)).toBe(0);
    expect(dayHours({ date: "x", hours: 3 }, 8)).toBe(3);
    expect(dayHours(undefined, 8)).toBe(8);
  });
});

describe("mapAllocation", () => {
  it("maps the record's fields", () => {
    const allocation = mapAllocation(
      record({
        recurrence_id: "REC",
        status: "Tentative",
        is_ai_created: 1,
        ai_allocation_reason: "Fits",
        include_weekends: 1,
        modified_by: "a@b.c",
        modified_by_full_name: "",
        modified: "2026-10-01 10:00:00",
      }),
    );
    expect(allocation).toMatchObject({
      id: "RA-1",
      employeeId: "EMP-1",
      projectId: "PROJ-1",
      recurrenceId: "REC",
      hours: 8,
      startDate: new Date(2026, 9, 19),
      endDate: new Date(2026, 9, 23),
      allocationHoursPerDay: 8,
      includeWeekends: true,
      includeHolidays: false,
      billable: true,
      tentative: true,
      isAiCreated: true,
      aiReason: "Fits",
      updatedBy: { name: "a@b.c" },
      updatedOn: new Date(2026, 9, 1, 10),
    });
  });
});

describe("mapAllocationSegments", () => {
  it("keeps an allocation without overrides whole", () => {
    expect(mapAllocationSegments(record())).toHaveLength(1);
  });

  it("splits at overrides and drops days that book nothing", () => {
    const segments = mapAllocationSegments(
      record({
        override: [
          { date: "2026-10-20", hours: 4 },
          { date: "2026-10-22", cancelled: 1 },
        ],
      }),
    );
    expect(
      segments.map(({ startDate, endDate, hours }) => [
        startDate.getDate(),
        endDate.getDate(),
        hours,
      ]),
    ).toEqual([
      [19, 19, 8],
      [20, 20, 4],
      [21, 21, 8],
      [23, 23, 8],
    ]);
    expect(segments.every((segment) => segment.id === "RA-1")).toBe(true);
    expect(segments[0].allocationEndDate).toEqual(new Date(2026, 9, 23));
  });

  it("keeps a zero-hour placeholder for an allocation reduced to nothing", () => {
    const [segment, ...rest] = mapAllocationSegments(
      record({
        total_allocated_hours: 0,
        override: [{ date: "2026-10-19", cancelled: 1 }],
      }),
    );
    expect(rest).toHaveLength(0);
    expect(segment).toMatchObject({ hours: 0, fullyReduced: true });
  });
});

describe("indexCustomers", () => {
  it("maps allocations and projects to their customer ids", () => {
    const index = indexCustomers([
      record({ customer: "CUST-1" }),
      record({ name: "RA-2", project: "PROJ-2", customer: null }),
    ]);
    expect(index.byAllocation.get("RA-1")).toBe("CUST-1");
    expect(index.byProject.get("PROJ-1")).toBe("CUST-1");
    expect(index.byProject.has("PROJ-2")).toBe(false);
  });
});
