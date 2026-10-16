import { dayjs } from "frappe-ui";
import {
  dailyExpectedHours,
  leaveHoursOn,
  toTaskStatus,
  type TimesheetLeave,
} from "@/components/Timesheet";
import { FALLBACK_DAILY_WORKING_HOURS } from "@/pages/timesheet/constants";
import type { TimesheetData } from "@/pages/timesheet/types";
import type { ApprovalDay, ApprovalEntry, ApprovalWeek } from "./types";

function leaveLabel(leave: TimesheetLeave, date: string): string {
  if (!(leave.half_day && leave.half_day_date === date)) return "Full day off";
  const half = leave.custom_first_halfsecond_half?.trim().toLowerCase();
  if (half === "first half") return "First half off";
  if (half === "second half") return "Second half off";
  return "Half day off";
}

function leaveLabelOn(
  leaves: TimesheetLeave[],
  date: string,
): string | undefined {
  const labels = new Set(
    leaves
      .filter((leave) => date >= leave.from_date && date <= leave.to_date)
      .map((leave) => leaveLabel(leave, date)),
  );
  return labels.size ? [...labels].join(", ") : undefined;
}

/**
 * The first week of a `get_timesheet_data` response as a flat list of entries, with the
 * week's total including the leave on the days that have entries.
 */
export function toApprovalWeek(data: TimesheetData | null): ApprovalWeek {
  const dailyHours = dailyExpectedHours(
    data?.working_hour ?? FALLBACK_DAILY_WORKING_HOURS,
    data?.working_frequency ?? "Per Day",
  );
  const [dateRange, week] = Object.entries(data?.data ?? {})[0] ?? [];
  if (!data || !dateRange || !week) {
    return {
      dateRange: "",
      totalHours: 0,
      entries: [],
      dailyHours: FALLBACK_DAILY_WORKING_HOURS,
    };
  }

  const leaveHoursByDate = new Map<string, number>();
  const entries: ApprovalEntry[] = Object.values(week.tasks).flatMap((task) =>
    task.data.map((entry) => {
      const date = entry.from_time.split(" ")[0];
      const holiday = data.holidays.find(
        (holiday) => holiday.holiday_date === date,
      );
      const leaveHours = leaveHoursOn(data.leaves, date, dailyHours, holiday);
      if (leaveHours > 0) leaveHoursByDate.set(date, leaveHours);
      const rejected = Boolean(entry.rejected_hours);
      return {
        name: entry.name,
        parent: entry.parent,
        taskId: task.name,
        taskName: task.subject,
        projectName: entry.project_name || task.project_name || "",
        hours: entry.hours,
        rejectedHours: entry.rejected_hours ?? 0,
        description: entry.description,
        date,
        taskStatus: toTaskStatus(task.status),
        isBillable: Boolean(task.is_billable),
        docstatus: entry.docstatus,
        leaveHours,
        leaveLabel:
          leaveHours > 0 ? leaveLabelOn(data.leaves, date) : undefined,
        // A parent marked Rejected says nothing about a row logged after that rejection.
        approvalStatus: rejected
          ? "Rejected"
          : entry.custom_approval_status === "Rejected"
            ? "Not Submitted"
            : entry.custom_approval_status || undefined,
        rejectionReason: rejected
          ? entry.custom_rejection_reason || undefined
          : undefined,
        weeklyRejectionReason:
          entry.custom_weekly_rejection_reason || undefined,
      };
    }),
  );

  const leaveHours = [...leaveHoursByDate.values()].reduce(
    (total, hours) => total + hours,
    0,
  );
  return {
    dateRange,
    totalHours: week.total_hours + leaveHours,
    entries,
    dailyHours,
  };
}

function isDecided(entry: ApprovalEntry): boolean {
  return (
    entry.docstatus === 1 ||
    entry.rejectedHours > 0 ||
    entry.approvalStatus === "Processing Timesheet"
  );
}

/** Entries grouped by day, oldest first; a day is decided when all its entries are. */
export function groupEntriesByDay(entries: ApprovalEntry[]): ApprovalDay[] {
  const days = new Map<string, ApprovalDay>();
  for (const entry of entries) {
    let day = days.get(entry.date);
    if (!day) {
      day = {
        date: entry.date,
        label: dayjs(entry.date).format("ddd, MMM D"),
        totalHours: entry.leaveHours,
        leaveLabel: entry.leaveLabel,
        isDecided: true,
        entries: [],
      };
      days.set(entry.date, day);
    }
    day.totalHours += entry.hours;
    day.isDecided &&= isDecided(entry);
    day.entries.push(entry);
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}
