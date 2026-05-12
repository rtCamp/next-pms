import type { Member, Project } from "@next-pms/design-system/components";
import { addMonths, addWeeks, parseISO } from "date-fns";
import { DEFAULT_HOURS_PER_WEEK } from "./constants";
import type { AllocationsDuration } from "./context";
import type { ManagerNameMap, TeamAllocationResponse } from "./type";

const DURATION_WEEK_COUNT: Record<AllocationsDuration, number> = {
  "this-week": 1,
  "this-month": 4,
  "this-quarter": 13,
};

/**
 * Parses a Frappe datetime string (YYYY-MM-DD HH:mm:ss.ssssss) into a Date.
 * Converts the space separator to 'T' for ISO compatibility.
 */
function parseFrappeDatetime(datetime: string): Date {
  return parseISO(datetime.replace(" ", "T"));
}

/**
 * Returns the number of weeks corresponding to a given duration type.
 */
export function getWeekCountForDuration(duration: AllocationsDuration) {
  return DURATION_WEEK_COUNT[duration];
}

/**
 * Moves the given date forward or backward based on the specified duration type.
 */
export function moveDateByDuration(
  anchorDate: Date,
  duration: AllocationsDuration,
  next: boolean,
): Date {
  const delta = next ? 1 : -1;

  if (duration === "this-week") {
    return addWeeks(anchorDate, delta);
  }

  if (duration === "this-month") {
    return addMonths(anchorDate, delta);
  }

  if (duration === "this-quarter") {
    return addMonths(anchorDate, 3 * delta);
  }

  return anchorDate;
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
  const { employees, resource_allocations, customer, leaves } = response;

  const employeeList = employees ?? [];
  const allocationList = resource_allocations ?? [];
  const leaveList = leaves ?? [];

  // Group allocations by employee, then by project
  const allocationsByEmployee = new Map<
    string,
    Map<
      string,
      {
        projectName: string;
        projectId: string;
        customerName: string;
        allocations: {
          id: string;
          employeeId: string;
          projectId: string;
          customerName: string;
          hours: number;
          startDate: Date;
          endDate: Date;
          billable: boolean;
          tentative: boolean;
          note?: string;
          createdOn?: Date;
          updatedOn?: Date;
          updatedBy?: { name: string; image?: string };
        }[];
      }
    >
  >();

  const leavesByEmployee = new Map<
    string,
    { startDate: Date; endDate: Date }[]
  >();

  for (const leave of leaveList) {
    const employeeLeaves = leavesByEmployee.get(leave.employee) ?? [];
    employeeLeaves.push({
      startDate: parseISO(leave.from_date),
      endDate: parseISO(leave.to_date),
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

    projectMap.get(alloc.project)!.allocations.push({
      id: alloc.name,
      employeeId: alloc.employee,
      projectId: alloc.project,
      customerName,
      hours: alloc.hours_allocated_per_day,
      startDate: parseISO(alloc.allocation_start_date),
      endDate: parseISO(alloc.allocation_end_date),
      billable: Boolean(alloc.is_billable),
      tentative: alloc.status === "Tentative",
      note: alloc.note ?? undefined,
      createdOn: alloc.creation
        ? parseFrappeDatetime(alloc.creation)
        : undefined,
      updatedOn: alloc.modified
        ? parseFrappeDatetime(alloc.modified)
        : undefined,
      updatedBy: alloc.modified_by
        ? {
            name: alloc.modified_by,
            image: alloc.modified_by_avatar || undefined,
          }
        : undefined,
    });
  }

  return employeeList.map((employee): Member => {
    const projectMap = allocationsByEmployee.get(employee.name);

    const projects: Project[] = projectMap
      ? Array.from(projectMap.entries()).map(
          ([, { projectName, customerName, allocations }]): Project => ({
            name: projectName,
            client: customerName || undefined,
            allocations,
          }),
        )
      : [];

    const memberLeaves = leavesByEmployee.get(employee.name) ?? [];

    return {
      id: employee.name,
      name: employee.employee_name,
      designation: employee.designation ?? undefined,
      department: employee.department ?? undefined,
      rate:
        calculateHourlyRate(
          employee.ctc,
          employee.custom_working_hours,
          employee.salary_currency,
        ) || undefined,
      capacity: formatCapacity(employee.custom_working_hours) || undefined,
      manager: employee.reports_to
        ? managerNameMap?.get(employee.reports_to)
        : undefined,
      image: employee.image ?? undefined,
      projects,
      leaves: memberLeaves,
    };
  });
}

/**
 * Calculates hourly rate from CTC and working hours.
 */
function calculateHourlyRate(
  ctc: number,
  hoursPerWeek: number,
  currency: string,
): string {
  if (!ctc) return "";
  const hours = hoursPerWeek > 0 ? hoursPerWeek : DEFAULT_HOURS_PER_WEEK;
  const monthlySalary = ctc / 12;
  const hourlyRate = monthlySalary / (hours * 4);
  return (
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(hourlyRate) + "/hr"
  );
}

/**
 * Formats working hours as a capacity string.
 */
function formatCapacity(hours: number): string {
  return hours > 0 ? `${hours} hrs/week` : "";
}
