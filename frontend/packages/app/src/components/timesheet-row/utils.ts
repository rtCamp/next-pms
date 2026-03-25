import { floatToTime } from "@next-pms/design-system";
import {
  calculateExtendedWorkingHour,
  calculateLeaveHours,
  calculateTotalHours,
  calculateWeeklyHour,
  expectatedHours,
} from "@/lib/utils";
import type { WorkingFrequency } from "@/types";
import type { HolidayProp, LeaveProps, TaskProps } from "@/types/timesheet";

export type ProjectTaskGroup = {
  project_name: string | null;
  project: string;
  tasks: TaskProps;
};

/**
 * Extracts the dates of holidays from an array of holiday objects.
 * @param holidays - An array of holiday objects.
 * @returns An array of holiday dates.
 */
export const getHolidayDates = (holidays: Array<HolidayProp>) => {
  return holidays.map((holiday) => holiday.holiday_date);
};

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

type RowComputationInput = {
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
  const totalTimeEntries: string[] = [];
  const totalTimeEntriesInHours: number[] = [];

  for (const date of dates) {
    const holiday = holidays.find((item) => item.holiday_date === date);
    const currentTotal =
      calculateTotalHours(tasks, date) +
      calculateLeaveHours(leaves, date, dailyWorkingHours, holiday);

    totalTimeEntries.push(
      currentTotal === 0 ? "" : floatToTime(currentTotal, 2),
    );
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
