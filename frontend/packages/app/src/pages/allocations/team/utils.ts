import type { Member, Project } from "@next-pms/design-system/components";
import { parseISO } from "date-fns";
import {
  calculateWeeklyHour,
  currencyFormat,
  expectatedHours,
  pickAllowed,
} from "@/lib/utils";
import type { WorkingFrequency } from "@/types";
import { mapResourceAllocation } from "../utils";
import {
  DEFAULT_CURRENCY,
  DEFAULT_HOURS_PER_WEEK,
  WEEKS_PER_MONTH,
} from "./constants";
import type { ManagerNameMap, TeamAllocationResponse } from "./type";

const WORKING_FREQUENCIES = ["Per Day", "Per Week"] as const;

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

    projectMap
      .get(alloc.project)!
      .allocations.push(mapResourceAllocation(alloc, customerName));
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
          employee.custom_work_schedule,
          employee.salary_currency,
        ) || undefined,
      capacity:
        formatCapacity(
          employee.custom_working_hours,
          employee.custom_work_schedule,
        ) || undefined,
      capacityHoursPerDay: getCapacityHoursPerDay(
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

/**
 * Calculates hourly rate from CTC, working hours, work schedule, and currency.
 * For "Per Day" schedules, monthly hours = daily hours * 20 working days.
 * For weekly schedules, monthly hours = weekly hours * 4.
 */
function calculateHourlyRate(
  ctc: number | undefined | null,
  workingHours: number | undefined | null,
  workSchedule: string | undefined | null,
  currency: string | undefined | null,
): string {
  if (!ctc) return "";
  const effectiveHours =
    workingHours && workingHours > 0 ? workingHours : DEFAULT_HOURS_PER_WEEK;
  const workingFrequency = resolveWorkingFrequency(workSchedule);
  const monthlyHours =
    calculateWeeklyHour(effectiveHours, workingFrequency) * WEEKS_PER_MONTH;
  const hourlyRate = ctc / 12 / monthlyHours;
  const resolvedCurrency = currency || DEFAULT_CURRENCY;
  return currencyFormat(resolvedCurrency).format(hourlyRate) + "/hr";
}

/**
 * Converts weekly or daily hours into a consistent daily hours value for capacity calculations.
 * For "Per Day" schedules, returns hours as-is. For weekly schedules, divides hours by 5.
 * Returns undefined if hours is not provided or invalid.
 */
function getCapacityHoursPerDay(
  hours: number | undefined | null,
  workSchedule: string | undefined | null,
): number | undefined {
  if (!hours || hours <= 0) {
    return undefined;
  }

  const dailyHours = expectatedHours(
    hours,
    resolveWorkingFrequency(workSchedule),
  );

  return Number(dailyHours.toFixed(2));
}

/**
 * Formats working hours as a weekly capacity string.
 * Converts daily hours to weekly (daily * 5) for "Per Day" schedules.
 */
function formatCapacity(
  hours: number | undefined | null,
  workSchedule: string | undefined | null,
): string {
  if (!hours || hours <= 0) return "";
  const weeklyHours = calculateWeeklyHour(
    hours,
    resolveWorkingFrequency(workSchedule),
  );
  return `${weeklyHours} hrs/week`;
}

/**
 * Resolves the working frequency ("Per Day" or "Per Week") from the employee's work schedule string.
 */
function resolveWorkingFrequency(
  workSchedule: string | undefined | null,
): WorkingFrequency {
  return pickAllowed(workSchedule, WORKING_FREQUENCIES) ?? "Per Week";
}
