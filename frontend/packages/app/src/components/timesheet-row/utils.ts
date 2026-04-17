import { floatToTime } from "@next-pms/design-system";
import {
  calculateExtendedWorkingHour,
  calculateLeaveHours,
  calculateTotalHours,
  calculateWeeklyHour,
  expectatedHours,
} from "@/lib/utils";
import type { WorkingFrequency } from "@/types";
import type {
  HolidayProp,
  LeaveProps,
  TaskDataProps,
  TaskProps,
} from "@/types/timesheet";
import type { ProjectTimesheetMember } from "./projectTimesheetRow";

export type ProjectTaskGroup = {
  project_name: string | null;
  project: string;
  tasks: TaskProps;
};

/**
 * Groups tasks by their associated projects.
 * @param taskMap - An object where keys are task identifiers and values are task data.
 * @returns An array of project groups, where each group contains the project name, project identifier, and the tasks associated with that project.
 */
export const groupTasksByProject = (taskMap: TaskProps): ProjectTaskGroup[] => {
  const projectMap = new Map<string, ProjectTaskGroup>();

  Object.entries(taskMap).forEach(([taskKey, taskData]) => {
    const { project, project_name } = taskData;

    if (!projectMap.has(project)) {
      projectMap.set(project, { project_name, project, tasks: {} });
    }

    projectMap.get(project)!.tasks[taskKey] = taskData;
  });

  return Array.from(projectMap.values());
};

export type RowComputationInput = {
  dates: string[];
  tasks: TaskProps;
  leaves: Array<LeaveProps>;
  holidays: Array<HolidayProp>;
  workingHour: number;
  workingFrequency: WorkingFrequency;
};

/**
 * Computes the total hours, daily time entries, and whether the working hours are extended for a given week.
 * @param input - An object containing the necessary data to compute the row data.
 * @returns An object containing the total hours, daily time entries, and whether the working hours are extended.
 */
export const computeRowData = ({
  dates,
  tasks,
  leaves,
  holidays,
  workingHour,
  workingFrequency,
}: RowComputationInput) => {
  const dailyWorkingHours = expectatedHours(workingHour, workingFrequency);

  let total = 0;
  const totalTimeEntries: { date: string; time: string }[] = [];
  const totalTimeEntriesInHours: number[] = [];

  for (const date of dates) {
    const holiday = holidays.find((holiday) => holiday.holiday_date === date);
    const currentTotal =
      calculateTotalHours(tasks, date) +
      calculateLeaveHours(leaves, date, dailyWorkingHours, holiday);
    totalTimeEntries.push({
      date,
      time: currentTotal === 0 ? "" : floatToTime(currentTotal, 2),
    });
    totalTimeEntriesInHours.push(currentTotal);
    total += currentTotal;
  }

  const expected = calculateWeeklyHour(workingHour, workingFrequency);
  const isExtended = calculateExtendedWorkingHour(
    total,
    expected,
    workingFrequency,
  );

  return {
    total,
    totalTimeEntries,
    totalTimeEntriesInHours,
    dailyWorkingHours,
    isExtended,
  };
};

/**
 * Merges tasks from multiple project members into a single TaskProps object.
 * @param members - An array of project members whose tasks need to be merged.
 * @returns A single TaskProps object containing all merged tasks.
 */
export const mergeProjectMemberTasks = (
  members: ProjectTimesheetMember[],
): TaskProps => {
  const mergedTasks: TaskProps = {};

  members.forEach((member) => {
    Object.entries(member.tasks).forEach(([taskKey, task]) => {
      mergedTasks[`${member.employee}::${taskKey}`] = task;
    });
  });

  return mergedTasks;
};

/**
 * Merges imported liked tasks with existing tasks for a week.
 * Only adds tasks that don't already exist in the tasks list.
 *
 * @param tasks - The existing tasks for the week
 * @param importedTasks - Array of imported task data from localStorage
 * @returns Merged tasks object with imported tasks added
 */
export const mergeImportedTasks = (
  tasks: TaskProps,
  importedTasks: TaskDataProps[],
): TaskProps => {
  if (!importedTasks.length) {
    return tasks;
  }

  const merged = { ...tasks };

  for (const importedTask of importedTasks) {
    // Skip if task already exists with time entries
    if (merged[importedTask.name]) {
      continue;
    }

    // Add as an empty task entry (no time entries)
    merged[importedTask.name] = {
      ...importedTask,
      data: [],
    };
  }

  return merged;
};
