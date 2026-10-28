import { describe, expect, it } from "vitest";
import type { AllocationRecord } from "@/pages/allocations/shared/types";
import {
  indexProjectCustomers,
  mapLeaveDays,
  mapProjectRows,
} from "./projectRows";
import type { ProjectAllocationsResponse } from "./types";

function allocation(overrides: Partial<AllocationRecord>): AllocationRecord {
  return {
    name: "RA-1",
    employee: "EMP-1",
    employee_name: "Asha Rao",
    project: "PROJ-1",
    project_name: "Atlas",
    customer: "CUST-1",
    hours_allocated_per_day: 4,
    total_allocated_hours: 20,
    allocation_start_date: "2026-10-19",
    allocation_end_date: "2026-10-23",
    is_billable: 1,
    ...overrides,
  };
}

function response(
  overrides: Partial<ProjectAllocationsResponse> = {},
): ProjectAllocationsResponse {
  return {
    data: [
      {
        name: "PROJ-1",
        project_name: "Atlas",
        customer: null,
        expected_start_date: "2026-10-01",
        expected_end_date: "2026-12-31",
        custom_project_manager_name: "Dana Lee",
        remaining_hours: 32,
        project_allocations: {
          "RA-1": allocation({}),
          "RA-2": allocation({
            name: "RA-2",
            allocation_start_date: "2026-10-26",
            allocation_end_date: "2026-11-06",
          }),
          "RA-3": allocation({
            name: "RA-3",
            employee: "EMP-2",
            employee_name: "Ben Ito",
            allocation_start_date: "2026-10-12",
            allocation_end_date: "2026-10-16",
          }),
        },
      },
      { name: "PROJ-2", customer: "CUST-2", project_allocations: {} },
    ],
    customer: { "CUST-1": { name: "Acme Corp" } },
    employees: {
      "EMP-1": {
        name: "EMP-1",
        employee_name: "Asha Rao",
        image: "/files/asha.png",
        designation: "Engineer",
        custom_working_hours: 8,
        custom_work_schedule: "Per Day",
        reports_to: "EMP-9",
      },
      "EMP-9": { name: "EMP-9", employee_name: "Dana Lee" },
    },
    employee_leaves: {},
    total_count: 2,
    has_more: false,
    ...overrides,
  };
}

describe("mapProjectRows", () => {
  it("maps a project's dates, customer, manager and remaining hours", () => {
    const [atlas, beacon] = mapProjectRows(response());
    expect(atlas).toMatchObject({
      id: "PROJ-1",
      name: "Atlas",
      customer: "Acme Corp",
      dateRange: "Oct 12 - Nov 6",
      projectDateRange: "Oct 1 - Dec 31",
      projectManager: "Dana Lee",
      remainingHours: 32,
    });
    expect(beacon).toMatchObject({
      id: "PROJ-2",
      name: "PROJ-2",
      customer: "CUST-2",
      dateRange: undefined,
      projectDateRange: undefined,
      projectManager: undefined,
      employees: [],
    });
  });

  it("prefers the project's customer and falls back to the allocations' dates", () => {
    const [atlas] = mapProjectRows(
      response({
        data: [
          {
            name: "PROJ-1",
            customer: "CUST-3",
            expected_end_date: "2026-12-31",
            project_allocations: [allocation({})],
          },
        ],
        customer: { "CUST-3": { name: "Zenith" } },
      }),
    );
    expect(atlas).toMatchObject({
      customer: "Zenith",
      dateRange: "Oct 19 - Oct 23",
      projectDateRange: "Dec 31",
    });
  });

  it("groups allocations by employee, in the order they come", () => {
    const [atlas] = mapProjectRows(response(), new Map([["EMP-9", "Dana L."]]));
    expect(atlas.employees?.map((employee) => employee.id)).toEqual([
      "EMP-1",
      "EMP-2",
    ]);
    const [asha, ben] = atlas.employees ?? [];
    expect(asha).toMatchObject({
      name: "Asha Rao",
      image: "/files/asha.png",
      designation: "Engineer",
      capacity: "40h/week",
      capacityHoursPerDay: 8,
      manager: "Dana L.",
    });
    expect(asha.allocations?.map((segment) => segment.id)).toEqual([
      "RA-1",
      "RA-2",
    ]);
    expect(ben).toMatchObject({
      name: "Ben Ito",
      capacity: undefined,
      manager: undefined,
      leaves: [],
    });
  });

  it("falls back to the employees map for the manager's name", () => {
    const [atlas] = mapProjectRows(response());
    expect(atlas.employees?.[0].manager).toBe("Dana Lee");
  });

  it("gives each employee their days away", () => {
    const [atlas] = mapProjectRows(
      response({
        employee_leaves: {
          "EMP-1": {
            "2026-10-20": {
              is_on_leave: true,
              is_holiday: false,
              total_leave_hours: 8,
            },
          },
        },
      }),
    );
    expect(atlas.employees?.[0].leaves).toEqual([
      { startDate: new Date(2026, 9, 20), endDate: new Date(2026, 9, 20) },
    ]);
  });
});

describe("mapLeaveDays", () => {
  const away = (hours: number) => ({
    is_on_leave: true,
    is_holiday: false,
    total_leave_hours: hours,
  });

  it("merges consecutive full days", () => {
    expect(
      mapLeaveDays(
        {
          "2026-10-21": away(8),
          "2026-10-20": away(8),
          "2026-10-23": away(8),
        },
        8,
      ),
    ).toEqual([
      { startDate: new Date(2026, 9, 20), endDate: new Date(2026, 9, 21) },
      { startDate: new Date(2026, 9, 23), endDate: new Date(2026, 9, 23) },
    ]);
  });

  it("keeps a half day and a holiday as days of their own", () => {
    expect(
      mapLeaveDays(
        {
          "2026-10-19": away(8),
          "2026-10-20": away(4),
          "2026-10-21": away(8),
          "2026-10-22": {
            is_on_leave: true,
            is_holiday: true,
            total_leave_hours: 8,
            holiday_name: " Diwali ",
          },
          "2026-10-23": { ...away(8), is_holiday: true },
        },
        8,
      ),
    ).toEqual([
      { startDate: new Date(2026, 9, 19), endDate: new Date(2026, 9, 19) },
      {
        startDate: new Date(2026, 9, 20),
        endDate: new Date(2026, 9, 20),
        halfDayDate: new Date(2026, 9, 20),
      },
      { startDate: new Date(2026, 9, 21), endDate: new Date(2026, 9, 21) },
      {
        startDate: new Date(2026, 9, 22),
        endDate: new Date(2026, 9, 22),
        label: "Diwali",
      },
      {
        startDate: new Date(2026, 9, 23),
        endDate: new Date(2026, 9, 23),
        label: "Holiday",
      },
    ]);
  });

  it("can't tell a half day without the employee's hours", () => {
    expect(mapLeaveDays({ "2026-10-20": away(4) }, undefined)).toEqual([
      { startDate: new Date(2026, 9, 20), endDate: new Date(2026, 9, 20) },
    ]);
  });

  it("skips days not marked as away", () => {
    expect(
      mapLeaveDays({ "2026-10-20": { ...away(8), is_on_leave: false } }, 8),
    ).toEqual([]);
  });
});

describe("indexProjectCustomers", () => {
  it("indexes allocations, and projects by their own customer first", () => {
    const { data } = response();
    const index = indexProjectCustomers([
      { ...data[0], customer: "CUST-9" },
      data[1],
    ]);
    expect(index.byAllocation.get("RA-1")).toBe("CUST-1");
    expect(index.byProject.get("PROJ-1")).toBe("CUST-9");
    expect(index.byProject.get("PROJ-2")).toBe("CUST-2");
  });
});
