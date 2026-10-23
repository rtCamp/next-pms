import { describe, expect, it } from "vitest";
import { mapTeamEmployees } from "./teamRows";
import type { TeamAllocationsResponse } from "./types";

function response(
  overrides: Partial<TeamAllocationsResponse> = {},
): TeamAllocationsResponse {
  return {
    employees: [
      {
        name: "EMP-1",
        employee_name: "Asha Rao",
        image: "/files/asha.png",
        designation: "Engineer",
        department: null,
        custom_working_hours: 8,
        custom_work_schedule: "Per Day",
        reports_to: "EMP-9",
      },
      { name: "EMP-2", employee_name: "Ben Ito" },
    ],
    leaves: [],
    holidays: [],
    resource_allocations: [],
    customer: {},
    total_count: 2,
    has_more: false,
    ...overrides,
  };
}

describe("mapTeamEmployees", () => {
  it("maps employees, with the manager's name and capacity", () => {
    const [asha, ben] = mapTeamEmployees(
      response(),
      new Map([["EMP-9", "Dana Lee"]]),
    );
    expect(asha).toMatchObject({
      id: "EMP-1",
      name: "Asha Rao",
      image: "/files/asha.png",
      designation: "Engineer",
      department: undefined,
      capacity: "40h/week",
      capacityHoursPerDay: 8,
      manager: "Dana Lee",
      rate: undefined,
      projects: [],
      leaves: [],
    });
    expect(ben).toMatchObject({ id: "EMP-2", capacity: undefined });
  });

  it("groups allocations by project and shows the customer's name", () => {
    const allocation = {
      employee: "EMP-1",
      project: "PROJ-1",
      project_name: "Atlas",
      customer: "CUST-0001",
      hours_allocated_per_day: 4,
      total_allocated_hours: 20,
      allocation_start_date: "2026-10-19",
      allocation_end_date: "2026-10-23",
      is_billable: 1,
    };
    const [asha] = mapTeamEmployees(
      response({
        resource_allocations: [
          { ...allocation, name: "RA-1" },
          {
            ...allocation,
            name: "RA-2",
            allocation_start_date: "2026-10-26",
            allocation_end_date: "2026-10-30",
          },
        ],
        customer: { "CUST-0001": { name: "Acme Corp" } },
      }),
    );
    expect(asha.projects).toHaveLength(1);
    expect(asha.projects?.[0]).toMatchObject({
      id: "PROJ-1",
      name: "Atlas",
      customer: "Acme Corp",
    });
    expect(asha.projects?.[0].allocations?.map((a) => a.id)).toEqual([
      "RA-1",
      "RA-2",
    ]);
  });

  it("maps leave, half days and holidays", () => {
    const [asha] = mapTeamEmployees(
      response({
        leaves: [
          {
            employee: "EMP-1",
            from_date: "2026-10-20",
            to_date: "2026-10-21",
            half_day: 1,
            half_day_date: "2026-10-21",
            custom_first_halfsecond_half: "Second Half",
          },
        ],
        holidays: [
          { employee: "EMP-1", holiday_date: "2026-10-23", description: " " },
        ],
      }),
    );
    expect(asha.leaves).toEqual([
      {
        startDate: new Date(2026, 9, 20),
        endDate: new Date(2026, 9, 21),
        halfDayDate: new Date(2026, 9, 21),
        halfDayPortion: "second",
      },
      {
        startDate: new Date(2026, 9, 23),
        endDate: new Date(2026, 9, 23),
        label: "Holiday",
      },
    ]);
  });
});
