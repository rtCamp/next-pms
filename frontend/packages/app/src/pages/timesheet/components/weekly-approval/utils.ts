/**
 * External Dependencies
 */
import { TaskStatusType } from "@next-pms/design-system/components";

/**
 * Internal Dependencies
 */

import type { TimesheetEntry, TimesheetApiResponse, GroupedDay } from "./types";

/**
 * Extracts the date part from a datetime string like "2026-03-16 00:00:00"
 */
const extractDate = (dateTimeStr: string): string => {
  return dateTimeStr.split(" ")[0];
};

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
          date: extractDate(entry.from_time),
          parent: entry.parent,
          status: task.status.toLowerCase() as TaskStatusType,
          isBillable: Boolean(task.is_billable),
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
/**
 * Groups entries by day and calculates total hours per day
 */
export const groupEntriesByDay = (entries: TimesheetEntry[]): GroupedDay[] => {
  const grouped = entries.reduce<Record<string, GroupedDay>>((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = {
        day: entry.day,
        totalHours: 0,
        entries: [],
      };
    }
    acc[entry.day].totalHours += entry.hours;
    acc[entry.day].entries.push(entry);
    return acc;
  }, {});

  return Object.values(grouped);
};
