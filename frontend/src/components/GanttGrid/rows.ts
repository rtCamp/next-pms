import { dayjs } from "frappe-ui";
import {
  countDays,
  dateAtColumn,
  rangeMetrics,
  type BarMetrics,
  type TimelineRange,
} from "./geometry";
import {
  allocationSummary,
  coveredDays,
  editableHoursPerDay,
  employeeSummary,
  freeCapacitySegments,
  projectSummarySegments,
  type ProjectSummarySegment,
  type SummarySegment,
} from "./summary";
import type {
  Allocation,
  AllocationEventData,
  AllocationSummaryText,
  GanttEmployee,
  GanttProject,
  GanttProjectEmployee,
  GanttProjectGroup,
} from "./types";

type BarRange = Pick<
  TimelineRange,
  "weekStart" | "showWeekend" | "columnCount" | "columnWidth"
>;

/** An allocation segment placed in the visible range. */
export interface AllocationBar extends Allocation, BarMetrics {
  projectName: string;
  customerName?: string;
  /** Shown days the whole segment covers, including any part outside the range. */
  fullNumDays: number;
}

export type SummaryBar = SummarySegment & BarMetrics;
export type ProjectSummaryBar = ProjectSummarySegment & BarMetrics;

export interface EmployeeRowProject extends Omit<GanttProject, "allocations"> {
  allocations: AllocationBar[];
}

/** A `team` row with its bars placed. */
export interface EmployeeRow extends Omit<GanttEmployee, "projects"> {
  key: string;
  projects: EmployeeRowProject[];
  summaryBars: SummaryBar[];
  freeBars: SummaryBar[];
}

export interface ProjectRowEmployee extends Omit<
  GanttProjectEmployee,
  "allocations"
> {
  allocations: AllocationBar[];
  leaveBars: SummaryBar[];
}

/** A `project` row with its bars placed. */
export interface ProjectRow extends Omit<GanttProjectGroup, "employees"> {
  key: string;
  employees: ProjectRowEmployee[];
  summaryBars: ProjectSummaryBar[];
}

function placeSegments<T extends { startDate: Date; endDate: Date }>(
  segments: T[],
  range: BarRange,
): (T & BarMetrics)[] {
  return segments.flatMap((segment) => {
    const metrics = rangeMetrics(segment.startDate, segment.endDate, range);
    return metrics ? [{ ...segment, ...metrics }] : [];
  });
}

function placeAllocations(
  allocations: Allocation[],
  range: BarRange,
  project: { name: string; customer?: string },
): AllocationBar[] {
  return placeSegments(allocations, range).map((bar) => ({
    ...bar,
    projectName: project.name,
    customerName: project.customer,
    fullNumDays: countDays(bar.startDate, bar.endDate, range.showWeekend),
  }));
}

/** A key for an employee row that survives reloads, for keeping it expanded. */
export function employeeKey(employee: GanttEmployee): string {
  return (
    employee.id ??
    `${employee.name}::${employee.designation ?? ""}::${employee.image ?? ""}`
  );
}

/** A key for a project row that survives reloads, for keeping it expanded. */
export function projectKey(project: GanttProjectGroup): string {
  return project.id ?? `${project.name}::${project.customer ?? ""}`;
}

/** `team` rows: each project's allocation bars, the summary bars and the free-capacity bars. */
export function prepareEmployeeRows(
  employees: GanttEmployee[],
  range: BarRange,
): EmployeeRow[] {
  const rangeStart = dateAtColumn(0, range.weekStart, range.showWeekend);
  const rangeEnd = dateAtColumn(
    range.columnCount - 1,
    range.weekStart,
    range.showWeekend,
  );
  return employees.map((employee) => {
    const sourceProjects = employee.projects ?? [];
    const summary = employeeSummary(sourceProjects, employee.leaves ?? []);
    return {
      ...employee,
      key: employeeKey(employee),
      projects: sourceProjects.map((project) => ({
        ...project,
        allocations: placeAllocations(
          project.allocations ?? [],
          range,
          project,
        ),
      })),
      summaryBars: placeSegments(summary, range),
      freeBars: placeSegments(
        freeCapacitySegments(coveredDays(summary), rangeStart, rangeEnd),
        range,
      ),
    };
  });
}

/** `project` rows: each employee's allocation and leave bars, and the project's summary bars. */
export function prepareProjectRows(
  projects: GanttProjectGroup[],
  range: BarRange,
): ProjectRow[] {
  return projects.map((project) => {
    const sourceEmployees = project.employees ?? [];
    return {
      ...project,
      key: projectKey(project),
      employees: sourceEmployees.map((employee) => ({
        ...employee,
        allocations: placeAllocations(
          employee.allocations ?? [],
          range,
          project,
        ),
        leaveBars: placeSegments(
          allocationSummary([], employee.leaves ?? []),
          range,
        ),
      })),
      summaryBars: placeSegments(
        projectSummarySegments(
          sourceEmployees.flatMap((employee) => employee.allocations ?? []),
        ),
        range,
      ),
    };
  });
}

/** The bars that share a day with the range. */
export function overlapping<T extends { startDate: Date; endDate: Date }>(
  bars: T[],
  startDate: Date,
  endDate: Date,
): T[] {
  return bars.filter(
    (bar) => bar.startDate <= endDate && bar.endDate >= startDate,
  );
}

/** What an edit or delete of an allocation segment carries. */
export function allocationEventData(
  bar: AllocationBar,
  employeeName?: string,
): AllocationEventData {
  return {
    allocationId: bar.id,
    employeeId: bar.employeeId,
    employeeName,
    projectId: bar.projectId,
    recurrenceId: bar.recurrenceId,
    projectName: bar.projectName,
    customerName: bar.customerName,
    startDate: bar.startDate,
    endDate: bar.endDate,
    hoursPerDay: editableHoursPerDay(bar),
    billable: bar.billable,
    tentative: bar.tentative,
    isAiCreated: bar.isAiCreated,
    aiReason: bar.aiReason,
    note: bar.note,
    override: bar.override,
    allocationStartDate: bar.allocationStartDate,
    allocationEndDate: bar.allocationEndDate,
    allocationHoursPerDay: bar.allocationHoursPerDay,
    includeWeekends: bar.includeWeekends,
    includeHolidays: bar.includeHolidays,
    segmentStartDate: bar.startDate,
    segmentEndDate: bar.endDate,
    segmentHoursPerDay: bar.hours,
  };
}

/** The allocation as its card describes it. */
export function allocationSummaryText(
  bar: AllocationBar,
): AllocationSummaryText {
  const format = (date: Date) => dayjs(date).format("MMM D, YYYY");
  return {
    projectName: bar.projectName,
    dateRange: `${format(bar.startDate)} – ${format(bar.endDate)}`,
    hoursPerDay: `${bar.hours}h/day`,
    totalHours: `${bar.hours * bar.fullNumDays} hours`,
  };
}

/** The project's page in the app, opened from cards. */
export function projectHref(projectId: string): string {
  return `/next-pms/projects/${encodeURIComponent(projectId)}`;
}

/** The employee's Desk form, opened from cards. */
export function employeeHref(employeeId: string): string {
  return `/desk/employee/${encodeURIComponent(employeeId)}`;
}

/** An allocation listed in a bar's card, with the employee it belongs to. */
export interface CardEntry {
  bar: AllocationBar;
  employeeName?: string;
  employeeImage?: string;
}
