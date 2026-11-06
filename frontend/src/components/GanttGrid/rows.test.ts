import { describe, expect, it } from "vitest";
import {
  allocationEventData,
  allocationSummaryText,
  employeeKey,
  overlapping,
  prepareEmployeeRows,
  prepareProjectRows,
  projectKey,
} from "./rows";
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

const range = {
  weekStart: day(19),
  showWeekend: true,
  columnCount: 14,
  columnWidth: 40,
};

describe("prepareEmployeeRows", () => {
  const [row] = prepareEmployeeRows(
    [
      {
        id: "EMP-1",
        name: "Asha Rao",
        projects: [
          {
            id: "PROJ-1",
            name: "Atlas",
            customer: "Acme",
            allocations: [allocation(12, 21, 4), allocation(5, 9, 8)],
          },
          {
            id: "PROJ-2",
            name: "Beacon",
            allocations: [allocation(20, 21, 4)],
          },
        ],
        leaves: [{ startDate: day(26), endDate: day(26) }],
      },
    ],
    range,
  );

  it("places each project's visible allocations", () => {
    expect(row.key).toBe("EMP-1");
    expect(row.projects[0].allocations).toHaveLength(1);
    expect(row.projects[0].allocations[0]).toMatchObject({
      projectName: "Atlas",
      customerName: "Acme",
      barOffset: 0,
      width: 120,
      fullNumDays: 10,
    });
  });

  it("builds the summary bars from all projects and leave", () => {
    expect(
      row.summaryBars.map((bar) => [bar.hours, bar.type, bar.barOffset]),
    ).toEqual([
      [4, "default", 0],
      [8, "default", 40],
      [0, "timeoff", 280],
    ]);
  });

  it("fills the uncovered weekdays with free-capacity bars", () => {
    expect(row.freeBars.map((bar) => [bar.barOffset, bar.width])).toEqual([
      [120, 80],
      [320, 160],
    ]);
  });
});

describe("prepareProjectRows", () => {
  const [row] = prepareProjectRows(
    [
      {
        id: "PROJ-1",
        name: "Atlas",
        customer: "Acme",
        employees: [
          {
            id: "EMP-1",
            name: "Asha Rao",
            allocations: [allocation(19, 23, 4)],
            leaves: [
              { startDate: day(21), endDate: day(21), label: "Holiday" },
            ],
          },
          {
            id: "EMP-2",
            name: "Ben Ito",
            allocations: [allocation(19, 20, 4)],
          },
        ],
      },
    ],
    range,
  );

  it("places each employee's allocations and leave", () => {
    expect(row.key).toBe("PROJ-1");
    expect(row.employees[0].allocations[0]).toMatchObject({
      projectName: "Atlas",
      customerName: "Acme",
      width: 200,
    });
    expect(row.employees[0].leaveBars[0]).toMatchObject({
      type: "timeoff",
      label: "Holiday",
      barOffset: 80,
    });
  });

  it("totals the employees' allocations in the summary bars", () => {
    expect(
      row.summaryBars.map((bar) => [bar.hours, bar.barOffset, bar.width]),
    ).toEqual([
      [16, 0, 80],
      [12, 80, 120],
    ]);
  });
});

describe("row keys", () => {
  it("prefers the id and falls back to the name", () => {
    expect(employeeKey({ id: "EMP-1", name: "Asha" })).toBe("EMP-1");
    expect(employeeKey({ name: "Asha", designation: "Dev" })).toBe(
      "Asha::Dev::",
    );
    expect(projectKey({ name: "Atlas", customer: "Acme" })).toBe("Atlas::Acme");
  });
});

describe("overlapping", () => {
  it("keeps bars sharing a day with the range", () => {
    const bars = [allocation(19, 20, 1), allocation(21, 22, 2)];
    expect(overlapping(bars, day(20), day(20))).toEqual([bars[0]]);
    expect(overlapping(bars, day(20), day(21))).toEqual(bars);
  });
});

describe("allocation events", () => {
  const [bar] = prepareEmployeeRows(
    [
      {
        name: "Asha Rao",
        projects: [
          {
            id: "PROJ-1",
            name: "Atlas",
            allocations: [
              allocation(19, 23, 0, {
                id: "RA-1",
                fullyReduced: true,
                allocationHoursPerDay: 6,
                recurrenceId: "REC-1",
              }),
            ],
          },
        ],
      },
    ],
    range,
  )[0].projects[0].allocations;

  it("carries the segment and the allocation's own values", () => {
    expect(allocationEventData(bar, "Asha Rao")).toMatchObject({
      allocationId: "RA-1",
      employeeName: "Asha Rao",
      projectName: "Atlas",
      recurrenceId: "REC-1",
      hoursPerDay: 6,
      segmentHoursPerDay: 0,
      segmentStartDate: day(19),
      segmentEndDate: day(23),
    });
  });

  it("describes the allocation as its card does", () => {
    expect(allocationSummaryText({ ...bar, hours: 8 })).toEqual({
      projectName: "Atlas",
      dateRange: "Oct 19, 2026 – Oct 23, 2026",
      hoursPerDay: "8h/day",
      totalHours: "40 hours",
    });
  });
});
