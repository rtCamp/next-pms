import { dayjs } from "frappe-ui";
import type {
  GanttProjectEmployee,
  GanttProjectGroup,
  LeaveAllocation,
} from "@/components/GanttGrid";
import {
  capacityHoursPerDay,
  capacityLabel,
  hourlyRateLabel,
} from "@/pages/allocations/shared/capacity";
import { parseISODate } from "@/pages/allocations/shared/dateWindow";
import {
  indexCustomers,
  mapAllocationSegments,
  type CustomerIndex,
} from "@/pages/allocations/shared/segments";
import type { AllocationRecord } from "@/pages/allocations/shared/types";
import type {
  ProjectAllocationsResponse,
  ProjectEmployeeRecord,
  ProjectLeaveDay,
  ProjectRecord,
} from "./types";

type CustomerLookup = ProjectAllocationsResponse["customer"];

function date(value: string): Date {
  return parseISODate(String(value).slice(0, 10)) ?? new Date(value);
}

function shortDate(value: string): string {
  return dayjs(date(value)).format("MMM D");
}

/** "Oct 19 - Oct 23", or one date when both ends are the same or one is missing. */
function dateRangeLabel(
  start: string | null | undefined,
  end: string | null | undefined,
): string | undefined {
  if (!start || !end || start === end) {
    const only = start || end;
    return only ? shortDate(only) : undefined;
  }
  return `${shortDate(start)} - ${shortDate(end)}`;
}

/** The project's allocations as a list; the endpoint keys them by name. */
export function projectAllocations(project: ProjectRecord): AllocationRecord[] {
  const allocations = project.project_allocations;
  if (!allocations) return [];
  return Array.isArray(allocations) ? allocations : Object.values(allocations);
}

/** The project's Customer id, else the first of its allocations that has one. */
export function projectCustomerId(project: ProjectRecord): string | undefined {
  return (
    project.customer ||
    projectAllocations(project).find((allocation) => allocation.customer)
      ?.customer ||
    undefined
  );
}

function customerName(id: string | undefined, customers: CustomerLookup) {
  return id ? customers?.[id]?.name || id : undefined;
}

/** The range from the earliest allocation start to the latest allocation end. */
function allocationsDateRange(allocations: AllocationRecord[]) {
  if (!allocations.length) return undefined;
  let start = allocations[0].allocation_start_date;
  let end = allocations[0].allocation_end_date;
  for (const allocation of allocations) {
    if (allocation.allocation_start_date < start) {
      start = allocation.allocation_start_date;
    }
    if (allocation.allocation_end_date > end) {
      end = allocation.allocation_end_date;
    }
  }
  return dateRangeLabel(start, end);
}

/**
 * An employee's days away as leave bars. Consecutive full days merge into one bar. A day
 * with fewer hours away than the employee's working day is a half day of its own, its
 * half unknown. A holiday is a one-day bar labelled with its name.
 */
export function mapLeaveDays(
  days: Record<string, ProjectLeaveDay>,
  hoursPerDay: number | undefined,
): LeaveAllocation[] {
  const ranges: LeaveAllocation[] = [];
  const dates = Object.keys(days)
    .filter((day) => days[day].is_on_leave)
    .sort();
  for (const day of dates) {
    const { total_leave_hours, is_holiday, holiday_name } = days[day];
    const start = date(day);
    const isHalfDay =
      hoursPerDay !== undefined &&
      total_leave_hours > 0 &&
      total_leave_hours < hoursPerDay;
    const label = is_holiday ? holiday_name?.trim() || "Holiday" : undefined;
    const last = ranges.at(-1);
    if (
      !isHalfDay &&
      !label &&
      last &&
      !last.halfDayDate &&
      !last.label &&
      dayjs(last.endDate).add(1, "day").isSame(start, "day")
    ) {
      last.endDate = start;
      continue;
    }
    ranges.push({
      startDate: start,
      endDate: start,
      ...(isHalfDay ? { halfDayDate: start } : {}),
      ...(label ? { label } : {}),
    });
  }
  return ranges;
}

function mapMembers(
  allocations: AllocationRecord[],
  response: ProjectAllocationsResponse,
  managerNames: Map<string, string>,
): GanttProjectEmployee[] {
  const employees = response.employees ?? {};
  const members = new Map<string, GanttProjectEmployee>();
  for (const allocation of allocations) {
    const id = allocation.employee ?? "";
    const segments = mapAllocationSegments(allocation);
    const member = members.get(id);
    if (member) {
      member.allocations?.push(...segments);
      continue;
    }
    const employee: Partial<ProjectEmployeeRecord> = employees[id] ?? {};
    const hoursPerDay = capacityHoursPerDay(employee);
    const leaveDays = response.employee_leaves?.[id];
    members.set(id, {
      id,
      name: employee.employee_name || allocation.employee_name || id,
      image: employee.image ?? undefined,
      designation: employee.designation ?? undefined,
      department: employee.department ?? undefined,
      rate: hourlyRateLabel(employee) || undefined,
      capacity: capacityLabel(employee) || undefined,
      capacityHoursPerDay: hoursPerDay,
      manager: employee.reports_to
        ? (managerNames.get(employee.reports_to) ??
          employees[employee.reports_to]?.employee_name)
        : undefined,
      allocations: segments,
      leaves: leaveDays ? mapLeaveDays(leaveDays, hoursPerDay) : [],
    });
  }
  return [...members.values()];
}

/**
 * A page of the Project endpoint as `GanttGrid` project rows: each project with its
 * dates, customer, manager and remaining hours, and the employees allocated to it with
 * their allocation segments and days away. `managerNames` maps an employee id to the
 * name shown as the reporting manager.
 */
export function mapProjectRows(
  response: ProjectAllocationsResponse,
  managerNames: Map<string, string> = new Map(),
): GanttProjectGroup[] {
  return (response.data ?? []).map((project) => {
    const allocations = projectAllocations(project);
    const dateRange = allocationsDateRange(allocations);
    return {
      id: project.name,
      name: project.project_name || project.name,
      customer: customerName(projectCustomerId(project), response.customer),
      dateRange,
      projectDateRange:
        dateRangeLabel(
          project.expected_start_date,
          project.expected_end_date,
        ) ?? dateRange,
      projectManager: project.custom_project_manager_name || undefined,
      remainingHours: project.remaining_hours ?? undefined,
      employees: mapMembers(allocations, response, managerNames),
    };
  });
}

/** Customer ids for the dialogs: by allocation, and by project from the project itself first. */
export function indexProjectCustomers(
  projects: ProjectRecord[],
): CustomerIndex {
  const index = indexCustomers(projects.flatMap(projectAllocations));
  for (const project of projects) {
    const id = projectCustomerId(project);
    if (id) index.byProject.set(project.name, id);
  }
  return index;
}
