import type {
  GanttEmployee,
  GanttProject,
  LeaveAllocation,
} from "@/components/GanttGrid";
import {
  capacityHoursPerDay,
  capacityLabel,
  hourlyRateLabel,
} from "@/pages/allocations/shared/capacity";
import { parseISODate } from "@/pages/allocations/shared/dateWindow";
import { mapAllocationSegments } from "@/pages/allocations/shared/segments";
import type {
  TeamAllocationsResponse,
  TeamHolidayRecord,
  TeamLeaveRecord,
} from "./types";

function date(value: string): Date {
  return parseISODate(String(value).slice(0, 10)) ?? new Date(value);
}

function halfDayPortion(
  value: string | null | undefined,
): LeaveAllocation["halfDayPortion"] {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "first half") return "first";
  if (normalized === "second half") return "second";
  return undefined;
}

function leaveAllocation(leave: TeamLeaveRecord): LeaveAllocation {
  return {
    startDate: date(leave.from_date),
    endDate: date(leave.to_date),
    ...(leave.half_day && leave.half_day_date
      ? {
          halfDayDate: date(leave.half_day_date),
          halfDayPortion: halfDayPortion(leave.custom_first_halfsecond_half),
        }
      : {}),
  };
}

/** A holiday as a one-day bar labelled with its name, so it reads apart from leave. */
function holidayAllocation(holiday: TeamHolidayRecord): LeaveAllocation {
  const day = date(holiday.holiday_date);
  return {
    startDate: day,
    endDate: day,
    label: holiday.description?.trim() || "Holiday",
  };
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(key(item));
    if (group) group.push(item);
    else groups.set(key(item), [item]);
  }
  return groups;
}

/**
 * A page of the Team endpoint as `GanttGrid` employees: each employee's projects with
 * their allocation segments, and their leave and holidays. `managerNames` maps an
 * employee id to the name shown as the reporting manager.
 */
export function mapTeamEmployees(
  response: TeamAllocationsResponse,
  managerNames: Map<string, string> = new Map(),
): GanttEmployee[] {
  const leaves = groupBy(response.leaves ?? [], (leave) => leave.employee);
  const holidays = groupBy(
    response.holidays ?? [],
    (holiday) => holiday.employee,
  );
  const projectsByEmployee = new Map<string, Map<string, GanttProject>>();
  for (const record of response.resource_allocations ?? []) {
    const employeeId = record.employee ?? "";
    const projectId = record.project ?? "";
    let projects = projectsByEmployee.get(employeeId);
    if (!projects) {
      projects = new Map();
      projectsByEmployee.set(employeeId, projects);
    }
    let project = projects.get(projectId);
    if (!project) {
      const customer = record.customer
        ? response.customer?.[record.customer]?.name || record.customer
        : undefined;
      project = {
        id: projectId,
        name: record.project_name || projectId,
        customer: customer || undefined,
        allocations: [],
      };
      projects.set(projectId, project);
    }
    project.allocations?.push(...mapAllocationSegments(record));
  }

  return (response.employees ?? []).map((employee) => ({
    id: employee.name,
    name: employee.employee_name,
    image: employee.image ?? undefined,
    designation: employee.designation ?? undefined,
    department: employee.department ?? undefined,
    rate: hourlyRateLabel(employee) || undefined,
    capacity: capacityLabel(employee) || undefined,
    capacityHoursPerDay: capacityHoursPerDay(employee),
    manager: employee.reports_to
      ? managerNames.get(employee.reports_to)
      : undefined,
    projects: [...(projectsByEmployee.get(employee.name)?.values() ?? [])],
    leaves: [
      ...(leaves.get(employee.name) ?? []).map(leaveAllocation),
      ...(holidays.get(employee.name) ?? []).map(holidayAllocation),
    ],
  }));
}
