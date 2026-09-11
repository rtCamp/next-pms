import type {
  LeaveAllocation,
  Member,
  Project,
} from "@next-pms/design-system/components";
import { parseISO } from "date-fns";
import {
  calculateAllocationHourlyRate,
  formatAllocationCapacity,
  getAllocationCapacityHoursPerDay,
  mapResourceAllocationSegments,
} from "../utils";
import { teamAllocationStatusOptionValues } from "./constants";
import type {
  AllocationTypeSelection,
  Holiday,
  ManagerNameMap,
  TeamAllocationResponse,
} from "./type";

/**
 * Resolves the allocation-type multi-select into the two axes the API takes.
 *
 * Billable / non-billable / no-allocation partition the employees, so selecting several
 * of them unions their groups. Selecting both billable options therefore means "either
 * kind of allocation" ([0, 1]) — not an unfiltered axis (null), which would also let
 * unallocated employees through.
 *
 * Confirmed / tentative form a second axis narrowing which allocations count. It cannot
 * apply to the no-allocation leg, since an unallocated employee has no allocation to
 * carry a status, so it is dropped when no-allocation is the only presence option picked.
 */
export function resolveAllocationTypeSelection(
  allocationsType: string[],
): AllocationTypeSelection {
  const hasBillable = allocationsType.includes("billable");
  const hasNonBillable = allocationsType.includes("non-billable");
  const includeUnallocated = allocationsType.includes("no-allocation");
  const isStatusApplicable =
    !includeUnallocated || hasBillable || hasNonBillable;

  return {
    billableValues: [
      ...(hasBillable ? [1] : []),
      ...(hasNonBillable ? [0] : []),
    ],
    statusValues: isStatusApplicable
      ? teamAllocationStatusOptionValues.filter((status) =>
          allocationsType.includes(status),
        )
      : [],
    includeUnallocated,
    isStatusApplicable,
  };
}

/**
 * Drops selections the query would ignore, so the multi-select never shows a checked
 * option that has no effect. Returns the input untouched when nothing needs dropping,
 * keeping the reference stable for memoisation.
 */
export function normalizeAllocationTypeSelection(
  allocationsType: string[],
): string[] {
  const { isStatusApplicable } =
    resolveAllocationTypeSelection(allocationsType);

  return isStatusApplicable
    ? allocationsType
    : allocationsType.filter(
        (value) => !teamAllocationStatusOptionValues.includes(value),
      );
}

/**
 * Reads the half a half-day leave covers. The field is a site customization, so
 * it can be absent even when half_day is set.
 */
function parseLeaveHalfDayPortion(
  half: string | null,
): LeaveAllocation["halfDayPortion"] {
  const normalized = half?.trim().toLowerCase();

  if (normalized === "first half") {
    return "first";
  }
  if (normalized === "second half") {
    return "second";
  }

  return undefined;
}

/**
 * Groups each employee's public holidays into single-day LeaveAllocation ranges, one per
 * holiday, labelled with the holiday's name so they render distinctly from approved leave
 * (which falls back to the generic "N days off" wording when no label is set).
 */
function buildEmployeeHolidayAllocations(
  holidayList: Holiday[],
): Map<string, LeaveAllocation[]> {
  const holidaysByEmployee = new Map<string, LeaveAllocation[]>();

  for (const holiday of holidayList) {
    const date = parseISO(holiday.holiday_date);
    const employeeHolidays = holidaysByEmployee.get(holiday.employee) ?? [];
    employeeHolidays.push({
      startDate: date,
      endDate: date,
      label: holiday.description.trim() || "Holiday",
    });
    holidaysByEmployee.set(holiday.employee, employeeHolidays);
  }

  return holidaysByEmployee;
}

/**
 * Converts a TeamAllocationResponse from the API into a Member[] array
 * suitable for the GanttGrid component.
 *
 * @param response - The API response containing employee and allocation data
 * @param managerNameMap - Optional map to resolve manager names from employee IDs
 */
export function mapTeamAllocationToMembers(
  response: TeamAllocationResponse,
  managerNameMap?: ManagerNameMap,
): Member[] {
  const { employees, resource_allocations, customer, leaves, holidays } =
    response;

  const employeeList = employees ?? [];
  const allocationList = resource_allocations ?? [];
  const leaveList = leaves ?? [];
  const holidaysByEmployee = buildEmployeeHolidayAllocations(holidays ?? []);

  // Group allocations by employee, then by project
  const allocationsByEmployee = new Map<
    string,
    Map<
      string,
      {
        projectName: string;
        projectId: string;
        customerName: string;
        allocations: ReturnType<typeof mapResourceAllocationSegments>;
      }
    >
  >();

  const leavesByEmployee = new Map<string, LeaveAllocation[]>();

  for (const leave of leaveList) {
    const employeeLeaves = leavesByEmployee.get(leave.employee) ?? [];
    employeeLeaves.push({
      startDate: parseISO(leave.from_date),
      endDate: parseISO(leave.to_date),
      ...(leave.half_day && leave.half_day_date
        ? {
            halfDayDate: parseISO(leave.half_day_date),
            halfDayPortion: parseLeaveHalfDayPortion(
              leave.custom_first_halfsecond_half,
            ),
          }
        : {}),
    });
    leavesByEmployee.set(leave.employee, employeeLeaves);
  }

  for (const alloc of allocationList) {
    if (!allocationsByEmployee.has(alloc.employee)) {
      allocationsByEmployee.set(alloc.employee, new Map());
    }
    const projectMap = allocationsByEmployee.get(alloc.employee)!;

    const customerName = customer[alloc.customer]?.name ?? alloc.customer ?? "";
    if (!projectMap.has(alloc.project)) {
      projectMap.set(alloc.project, {
        projectName: alloc.project_name || alloc.project,
        projectId: alloc.project,
        customerName,
        allocations: [],
      });
    }

    projectMap
      .get(alloc.project)!
      .allocations.push(...mapResourceAllocationSegments(alloc, customerName));
  }

  return employeeList.map((employee): Member => {
    const projectMap = allocationsByEmployee.get(employee.name);

    const projects: Project[] = projectMap
      ? Array.from(projectMap.entries()).map(
          ([
            projectId,
            { projectName, customerName, allocations },
          ]): Project => ({
            id: projectId,
            name: projectName,
            client: customerName || undefined,
            allocations,
          }),
        )
      : [];

    const memberLeaves = [
      ...(leavesByEmployee.get(employee.name) ?? []),
      ...(holidaysByEmployee.get(employee.name) ?? []),
    ];

    return {
      id: employee.name,
      name: employee.employee_name,
      designation: employee.designation ?? undefined,
      department: employee.department ?? undefined,
      rate:
        calculateAllocationHourlyRate(
          employee.ctc,
          employee.custom_working_hours,
          employee.custom_work_schedule,
          employee.salary_currency,
        ) || undefined,
      capacity:
        formatAllocationCapacity(
          employee.custom_working_hours,
          employee.custom_work_schedule,
        ) || undefined,
      capacityHoursPerDay: getAllocationCapacityHoursPerDay(
        employee.custom_working_hours,
        employee.custom_work_schedule,
      ),
      manager: employee.reports_to
        ? managerNameMap?.get(employee.reports_to)
        : undefined,
      image: employee.image ?? undefined,
      projects,
      leaves: memberLeaves,
    };
  });
}
