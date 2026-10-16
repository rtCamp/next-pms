import { dayjs } from "frappe-ui";
import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import type { WorkingFrequency } from "@/session";
import { floatToTime } from "@/utils/format";
import { stripTags } from "@/utils/text";
import { TOTAL_HOURS_THEME } from "./constants";
import type {
  DayCell,
  HoursComparison,
  TaskRowTimeEntry,
  TimeEntry,
  TimeOffEntry,
  TimesheetHoliday,
  TimesheetLeave,
  TimesheetTask,
  TimesheetTasks,
  TotalHoursTheme,
} from "./types";

/** Hours as a cell shows them: `"02:30"`, or `""` (a dash) for none. */
export function cellTime(hours: number): string {
  return hours === 0 ? "" : floatToTime(hours);
}

/** Today as `YYYY-MM-DD`. */
export function today(): string {
  return dayjs().format("YYYY-MM-DD");
}

/** `YYYY-MM-DD` dates as `"MMM D"`, e.g. `"Dec 29"`, as the week row shows them. */
export function shortDates(dates: string[]): string[] {
  return dates.map((date) => dayjs(date).format("MMM D"));
}

/** `YYYY-MM-DD` dates as short weekday names, e.g. `"Mon"`, for the header row. */
export function dayLabels(dates: string[]): string[] {
  return dates.map((date) => dayjs(date).format("ddd"));
}

/** The day a time entry is for, from its `from_time`. */
export function entryDate(entry: TimeEntry): string {
  return entry.from_time.split(" ")[0];
}

function sumEntryHours(
  tasks: TimesheetTasks,
  date: string,
  pick: (entry: TimeEntry) => number,
): number {
  return Object.values(tasks).reduce(
    (total, task) =>
      total +
      task.data
        .filter((entry) => entryDate(entry) === date)
        .reduce((sum, entry) => sum + pick(entry), 0),
    0,
  );
}

/** Hours logged on `date` across `tasks`. */
export function hoursOn(tasks: TimesheetTasks, date: string): number {
  return sumEntryHours(tasks, date, (entry) => entry.hours);
}

/** Hours parked by rejections on `date` across `tasks`. */
export function rejectedHoursOn(tasks: TimesheetTasks, date: string): number {
  return sumEntryHours(tasks, date, (entry) => entry.rejected_hours ?? 0);
}

/** Hours an employee is expected to work a day. */
export function dailyExpectedHours(
  workingHour: number,
  frequency: WorkingFrequency,
): number {
  return frequency === "Per Day" ? workingHour : workingHour / 5;
}

/** Hours an employee is expected to work a week. */
export function weeklyExpectedHours(
  workingHour: number,
  frequency: WorkingFrequency,
): number {
  return frequency === "Per Day" ? workingHour * 5 : workingHour;
}

/** Hours on leave on `date`; none on a holiday or weekly off. */
export function leaveHoursOn(
  leaves: TimesheetLeave[],
  date: string,
  dailyHours: number,
  holiday: TimesheetHoliday | undefined,
): number {
  if (holiday) return 0;
  return leaves.reduce((total, leave) => {
    if (date < leave.from_date || date > leave.to_date) return total;
    return (
      total +
      (leave.half_day && leave.half_day_date === date
        ? dailyHours / 2
        : dailyHours)
    );
  }, 0);
}

/** Hours off on `date`: a full day for a named holiday, else the leave hours. */
export function timeOffHoursOn(
  leaves: TimesheetLeave[],
  date: string,
  dailyHours: number,
  holiday: TimesheetHoliday | undefined,
): number {
  if (holiday && !holiday.weekly_off) return dailyHours;
  return leaveHoursOn(leaves, date, dailyHours, holiday);
}

/** How `hours` compare with `expected`, to the minute. */
export function compareHours(hours: number, expected: number): HoursComparison {
  const rounded = Math.round(hours * 60) / 60;
  if (rounded > expected) return "over";
  if (rounded < expected) return "short";
  return "met";
}

/**
 * Whether `date` is before the backdated-entry limit. The boundary comes from the
 * server, which already allows for holidays, weekly offs, leave and the manager limit.
 */
export function isDateBackdateRestricted(
  date: string,
  restrictedBefore: string | null | undefined,
): boolean {
  return Boolean(restrictedBefore) && date < restrictedBefore!;
}

/** Whether any of `tasks` has a submitted (approved) entry on `date`. */
export function hasApprovedTimeEntry(
  tasks: TimesheetTasks,
  date: string,
): boolean {
  return Object.values(tasks).some((task) =>
    task.data.some(
      (entry) => entry.from_time.includes(date) && entry.docstatus === 1,
    ),
  );
}

export interface ProjectTasks {
  project: string;
  projectName: string | null;
  tasks: TimesheetTasks;
}

/** `tasks` grouped by project, in the order the projects first appear. */
export function groupTasksByProject(tasks: TimesheetTasks): ProjectTasks[] {
  const projects = new Map<string, ProjectTasks>();
  for (const [taskKey, task] of Object.entries(tasks)) {
    if (!projects.has(task.project)) {
      projects.set(task.project, {
        project: task.project,
        projectName: task.project_name,
        tasks: {},
      });
    }
    projects.get(task.project)!.tasks[taskKey] = task;
  }
  return [...projects.values()];
}

/** Every member's tasks in one map, keyed `employee::task` so they stay apart. */
export function mergeMemberTasks(
  members: { employee: string; tasks: TimesheetTasks }[],
): TimesheetTasks {
  const merged: TimesheetTasks = {};
  for (const member of members) {
    for (const [taskKey, task] of Object.entries(member.tasks)) {
      merged[`${member.employee}::${taskKey}`] = task;
    }
  }
  return merged;
}

/** `tasks` plus the imported liked tasks it lacks, added without entries. */
export function mergeImportedTasks(
  tasks: TimesheetTasks,
  importedTasks: Omit<TimesheetTask, "data">[],
): TimesheetTasks {
  if (!importedTasks.length) return tasks;
  const merged = { ...tasks };
  for (const task of importedTasks) {
    merged[task.name] ??= { ...task, data: [] };
  }
  return merged;
}

export interface WeekTotalsInput {
  dates: string[];
  tasks: TimesheetTasks;
  leaves: TimesheetLeave[];
  holidays: TimesheetHoliday[];
  workingHour: number;
  workingFrequency: WorkingFrequency;
}

export interface WeekTotals {
  /** Hours logged plus time off in the week. */
  total: number;
  /** One cell per day: time logged plus time off. */
  cells: DayCell[];
  /** The same per day, in hours. */
  hoursPerDay: number[];
  /** Hours expected a day. */
  dailyHours: number;
  /** Colour of the week's total against the hours expected. */
  theme: TotalHoursTheme;
}

/** A week's (or a member's week's) totals: time logged plus time off, per day. */
export function computeWeekTotals({
  dates,
  tasks,
  leaves,
  holidays,
  workingHour,
  workingFrequency,
}: WeekTotalsInput): WeekTotals {
  const dailyHours = dailyExpectedHours(workingHour, workingFrequency);
  const hoursPerDay = dates.map((date) => {
    const holiday = holidays.find((day) => day.holiday_date === date);
    return (
      hoursOn(tasks, date) + timeOffHoursOn(leaves, date, dailyHours, holiday)
    );
  });
  const total = hoursPerDay.reduce((sum, hours) => sum + hours, 0);
  return {
    total,
    cells: dates.map((date, index) => ({
      date,
      time: cellTime(hoursPerDay[index]),
      disabled: false,
    })),
    hoursPerDay,
    dailyHours,
    theme:
      TOTAL_HOURS_THEME[
        compareHours(total, weeklyExpectedHours(workingHour, workingFrequency))
      ],
  };
}

export interface ProjectCellsInput {
  dates: string[];
  tasks: TimesheetTasks;
  /** Turns every cell off. */
  disabled?: boolean;
  /** Turns off the days with an approved entry. */
  lockApproved?: boolean;
  backdateRestrictedBefore?: string | null;
}

/** A project's hours per day, with days locked by approval or the backdate limit. */
export function computeProjectCells({
  dates,
  tasks,
  disabled = false,
  lockApproved = true,
  backdateRestrictedBefore,
}: ProjectCellsInput): { total: number; cells: DayCell[] } {
  let total = 0;
  const cells = dates.map((date) => {
    const hours = hoursOn(tasks, date);
    total += hours;
    return {
      date,
      time: cellTime(hours),
      disabled:
        disabled ||
        (lockApproved && hasApprovedTimeEntry(tasks, date)) ||
        isDateBackdateRestricted(date, backdateRestrictedBefore),
    };
  });
  return { total, cells };
}

// A day shows the most pressing status of its entries.
const STATUS_PRIORITY: Partial<Record<ApprovalStatusValue, number>> = {
  "Approval Pending": 4,
  "Processing Timesheet": 3,
  Approved: 2,
};

/** Status, rejection reason and lock of one task's entries on one day. */
function taskDayState(entries: TimeEntry[]) {
  let status: ApprovalStatusValue | undefined;
  let highestPriority = 0;
  let rejectionReason: string | null = null;
  for (const entry of entries) {
    if (entry.rejected_hours) {
      rejectionReason ??= entry.custom_rejection_reason ?? null;
      continue;
    }
    if (!entry.custom_approval_status) continue;
    // A parent marked Rejected says nothing about a row logged after that rejection.
    const entryStatus =
      entry.custom_approval_status === "Rejected"
        ? "Not Submitted"
        : entry.custom_approval_status;
    const priority = STATUS_PRIORITY[entryStatus] ?? 1;
    if (priority > highestPriority) {
      highestPriority = priority;
      status = entryStatus;
    }
  }
  const fullyApproved =
    entries.length > 0 &&
    entries.every((entry) => entry.custom_approval_status === "Approved");
  return { status, rejectionReason, fullyApproved };
}

export interface TaskCellsInput {
  dates: string[];
  task: TimesheetTask;
  /** Turns every cell off (the member's week is approved or processing). */
  disabled?: boolean;
  backdateRestrictedBefore?: string | null;
}

export interface TaskCells {
  /** Hours logged on the task in the week. */
  total: number;
  cells: TaskRowTimeEntry[];
  /** The task's entries per day, for the entry popover. */
  entriesByDay: TimeEntry[][];
}

/**
 * A task's cells: the hours logged (or, on a day with nothing else, the rejected
 * hours), the day's most pressing approval status, the rejection reason, a
 * non-billable mark, and a lock when every entry is approved or the day is before
 * the backdate limit.
 */
export function computeTaskCells({
  dates,
  task,
  disabled = false,
  backdateRestrictedBefore,
}: TaskCellsInput): TaskCells {
  const tasks = { [task.name]: task };
  let total = 0;
  const entriesByDay: TimeEntry[][] = [];
  const cells = dates.map((date): TaskRowTimeEntry => {
    const hours = hoursOn(tasks, date);
    const rejectedHours = rejectedHoursOn(tasks, date);
    const shownHours = hours > 0 ? hours : rejectedHours;
    const entries = task.data.filter((entry) => entry.from_time.includes(date));
    const state = taskDayState(entries);
    total += hours;
    entriesByDay.push(entries);
    return {
      date,
      time: cellTime(shownHours),
      nonBillable: shownHours !== 0 && !task.is_billable,
      disabled:
        disabled ||
        state.fullyApproved ||
        isDateBackdateRestricted(date, backdateRestrictedBefore),
      status: hours === 0 && rejectedHours > 0 ? "Rejected" : state.status,
      rejectionReason: state.rejectionReason,
    };
  });
  return { total, cells, entriesByDay };
}

export interface TimeOffCellsInput {
  dates: string[];
  leaves: TimesheetLeave[];
  holidays: TimesheetHoliday[];
  /** Hours expected a day, which a day off counts as. */
  dailyHours: number;
}

/**
 * Time off per day. `visible` is false when there is nothing to show: no time off
 * and no holiday other than weekly offs.
 */
export function computeTimeOffCells({
  dates,
  leaves,
  holidays,
  dailyHours,
}: TimeOffCellsInput): {
  total: number;
  cells: TimeOffEntry[];
  visible: boolean;
} {
  let total = 0;
  let hasNamedHoliday = false;
  const cells = dates.map((date): TimeOffEntry => {
    const holiday = holidays.find((day) => day.holiday_date === date);
    const hours = timeOffHoursOn(leaves, date, dailyHours, holiday);
    hasNamedHoliday ||= Boolean(holiday && !holiday.weekly_off);
    total += hours;
    return {
      time: cellTime(hours),
      holiday: Boolean(holiday),
      holidayDescription: stripTags(holiday?.description ?? "") || undefined,
    };
  });
  return {
    total,
    cells,
    visible: floatToTime(total) !== "00:00" || hasNamedHoliday,
  };
}

/**
 * One member's status on one project, from that project's entries alone (the
 * member's week status covers every project).
 */
export function resolveProjectApprovalStatus(
  tasks: TimesheetTasks,
): ApprovalStatusValue {
  const statuses = Object.values(tasks).flatMap((task) =>
    task.data.map((entry) => entry.custom_approval_status || "Not Submitted"),
  );
  if (statuses.length === 0) return "Not Submitted";
  const every = (status: ApprovalStatusValue) =>
    statuses.every((value) => value === status);
  if (every("Approval Pending")) return "Approval Pending";
  if (every("Rejected")) return "Rejected";
  if (every("Approved")) return "Approved";
  if (statuses.includes("Processing Timesheet")) return "Processing Timesheet";
  if (statuses.includes("Rejected")) return "Partially Rejected";
  if (statuses.includes("Approved")) return "Partially Approved";
  if (statuses.includes("Approval Pending")) return "Approval Pending";
  return "Not Submitted";
}
