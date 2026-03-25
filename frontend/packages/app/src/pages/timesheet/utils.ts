/**
 * Internal dependencies
 */
import { getFormatedDate, normalizeDate } from "@next-pms/design-system";
import { TaskStatusType } from "@next-pms/design-system/components";
import { isDateInRange } from "@/lib/utils";
import type { TimesheetState } from "./components/types";

export interface TimesheetEntry {
  timesheetId: string;
  taskId: string;
  taskName: string;
  projectId: string;
  projectName: string;
  hours: number;
  description: string;
  day: string;
  status: TaskStatusType;
}

interface TaskDataEntry {
  name: string;
  from_time: string;
  to_time: string;
  description: string;
  project: string;
  task: string;
  project_name: string;
  is_billable: number;
  hours: number;
  parent: string;
  docstatus: number;
}

interface Task {
  name: string;
  subject: string;
  data: TaskDataEntry[];
  is_billable: number;
  project_name: string;
  project: string;
  expected_time: number;
  actual_time: number;
  status: string;
  _liked_by: string | null;
  exp_end_date: string;
}

interface WeekData {
  start_date: string;
  end_date: string;
  key: string;
  dates: string[];
  total_hours: number;
  tasks: Record<string, Task>;
  status: string;
}

interface TimesheetApiResponse {
  message: {
    working_hour: number;
    working_frequency: string;
    leaves: unknown[];
    holidays: unknown[];
    data: Record<string, WeekData>;
  };
}

/**
 * Formats a datetime string like "2026-03-16 00:00:00" to "Mon, Mar 16"
 */
const formatDay = (dateTimeStr: string): string => {
  const date = new Date(dateTimeStr.replace(" ", "T"));
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${weekday}, ${month} ${day}`;
};

/**
 * Converts the timesheet API response into a flat array of entries.
 * Each entry contains taskName, projectName, hours, and description.
 */
export const convertTimesheetToEntries = (response: TimesheetApiResponse) => {
  const entries: TimesheetEntry[] = [];
  const weeklyData = response?.message?.data;

  if (!weeklyData) {
    return { dateRange: "", totalHours: 0, entries };
  }

  const thisWeek = Object.values(weeklyData)[0];
  const thisWeekTasks = Object.values(thisWeek.tasks);
  const thisWeekDateRange = Object.keys(weeklyData)[0];

  thisWeekTasks.forEach((task) => {
    if (task.data && Array.isArray(task.data)) {
      task.data.forEach((entry) => {
        entries.push({
          timesheetId: entry.name,
          taskId: task.name,
          taskName: task.subject,
          projectId: task.project_name,
          projectName: entry.project_name || task.project_name,
          hours: entry.hours,
          description: entry.description,
          day: formatDay(entry.from_time),
          status: task.status.toLowerCase() as TaskStatusType,
        });
      });
    }
  });

  return {
    dateRange: thisWeekDateRange,
    totalHours: Object.values(weeklyData)[0].total_hours,
    entries,
  };
};

export const validateDate = (
  startDateParam: string,
  timesheet: TimesheetState,
) => {
  if (!startDateParam) {
    return true;
  }
  const date = getFormatedDate(normalizeDate(startDateParam));
  const timesheetData = timesheet.data?.data;
  if (timesheetData && Object.keys(timesheetData).length > 0) {
    const keys = Object.keys(timesheetData);
    const firstObject = timesheetData[keys[0]];
    const lastObject = timesheetData[keys[keys.length - 1]];
    if (isDateInRange(date, lastObject.start_date, firstObject.end_date)) {
      return true;
    }
  }

  return false;
};
