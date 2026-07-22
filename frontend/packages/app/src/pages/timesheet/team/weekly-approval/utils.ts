/**
 * External Dependencies
 */
import {
  statusIcon,
  taskStatusMap,
  type TaskStatusType,
} from "@next-pms/design-system/components";

/**
 * Internal Dependencies
 */

import { FALLBACK_DAILY_WORKING_HOURS } from "@/lib/constant";
import { calculateLeaveHours, expectatedHours } from "@/lib/utils";
import type { LeaveProps } from "@/types/timesheet";
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

const normalizeTaskStatus = (status: string): TaskStatusType => {
  const mappedStatus = taskStatusMap[status];
  if (mappedStatus) {
    return mappedStatus;
  }

  return status in statusIcon ? (status as TaskStatusType) : "open";
};

const getLeaveLabel = (leave: LeaveProps, date: string): string => {
  const isHalfDayLeave = leave.half_day && leave.half_day_date === date;

  if (!isHalfDayLeave) {
    return "Full day off";
  }

  const half = leave.custom_first_halfsecond_half?.trim().toLowerCase();
  if (half === "first half") {
    return "First half off";
  }
  if (half === "second half") {
    return "Second half off";
  }

  return "Half day off";
};

const getLeaveLabelForDate = (
  leaves: LeaveProps[],
  date: string,
): string | undefined => {
  const labels = leaves
    .filter((leave) => date >= leave.from_date && date <= leave.to_date)
    .map((leave) => getLeaveLabel(leave, date));

  const uniqueLabels = [...new Set(labels)];
  return uniqueLabels.length > 0 ? uniqueLabels.join(", ") : undefined;
};

/**
 * Converts the timesheet API response into a flat array of entries.
 * Each entry contains taskName, projectName, hours, and description.
 */
export const convertTimesheetToEntries = (response: TimesheetApiResponse) => {
  const entries: TimesheetEntry[] = [];
  const weeklyData = response?.message?.data;

  if (!weeklyData) {
    return {
      dateRange: "",
      totalHours: 0,
      status: "",
      entries,
      dailyWorkingHours: FALLBACK_DAILY_WORKING_HOURS,
    };
  }

  const thisWeek = Object.values(weeklyData)[0];
  const thisWeekTasks = Object.values(thisWeek.tasks);
  const thisWeekDateRange = Object.keys(weeklyData)[0];
  const leaves = response?.message?.leaves ?? [];
  const holidays = response?.message?.holidays ?? [];
  const displayedLeaveHoursByDate = new Map<string, number>();
  const dailyWorkingHours = expectatedHours(
    response?.message?.working_hour ?? FALLBACK_DAILY_WORKING_HOURS,
    response?.message?.working_frequency ?? "Per Day",
  );

  thisWeekTasks.forEach((task) => {
    if (task.data && Array.isArray(task.data)) {
      task.data.forEach((entry) => {
        const date = extractDate(entry.from_time);
        const holiday = holidays.find(
          (holiday) => holiday.holiday_date === date,
        );
        const leaveHours = calculateLeaveHours(
          leaves,
          date,
          dailyWorkingHours,
          holiday,
        );

        if (leaveHours > 0) {
          displayedLeaveHoursByDate.set(date, leaveHours);
        }

        entries.push({
          timesheetId: entry.name,
          taskId: task.name,
          taskName: task.subject,
          projectId: task.project_name,
          projectName: entry.project_name || task.project_name,
          hours: entry.hours,
          description: entry.description,
          day: formatDay(entry.from_time),
          date,
          parent: entry.parent,
          status: normalizeTaskStatus(task.status),
          isBillable: Boolean(task.is_billable),
          docstatus: entry.docstatus,
          leaveHours,
          leaveLabel:
            leaveHours > 0 ? getLeaveLabelForDate(leaves, date) : undefined,
          approvalStatus: entry.custom_approval_status!,
          rejectionReason: entry.custom_rejection_reason || undefined,
        });
      });
    }
  });

  const displayedLeaveHours = [...displayedLeaveHoursByDate.values()].reduce(
    (total, hours) => total + hours,
    0,
  );

  return {
    dateRange: thisWeekDateRange,
    totalHours: Object.values(weeklyData)[0].total_hours + displayedLeaveHours,
    status: thisWeek.status,
    entries,
    dailyWorkingHours,
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
        date: entry.date,
        totalHours: entry.leaveHours,
        leaveLabel: entry.leaveLabel,
        entries: [],
      };
    }
    acc[entry.day].totalHours += entry.hours;
    acc[entry.day].entries.push(entry);
    return acc;
  }, {});

  return Object.values(grouped).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
};
