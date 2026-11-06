import { dayjs } from "frappe-ui";
import type { ApprovalStatusValue } from "@/components/ApprovalStatus";

export interface TeamTimesheet {
  employee: string;
  employee_name: string;
  user_image: string | null;
  billable_hours: number;
  non_billable_hours: number;
  expected_hours: number;
  delta: number;
  weekly_approval_status: ApprovalStatusValue;
}

export const LAST_WEEK = "last-week";
export const THIS_WEEK = "this-week";
/** Handled like React, though the period menu doesn't offer it either. */
export const THIS_MONTH = "this-month";

export const PERIOD_OPTIONS = [
  { value: LAST_WEEK, label: "Last week" },
  { value: THIS_WEEK, label: "This week" },
];

/** `get_team_timesheets`'s `days`: 7 for last week, else the days so far this week or month. */
export function periodDays(period: string, today: Date): number {
  const day = dayjs(today).startOf("day");
  if (period === THIS_WEEK) return ((day.day() + 6) % 7) + 1;
  if (period === THIS_MONTH) return day.date();
  return 7;
}

/** The team timesheet filtered to one employee, in the React app's URL format. */
export function teamTimesheetUrl(employeeId: string): string {
  return `/timesheet/team?compositeFilters=${encodeURI(
    JSON.stringify([
      {
        id: "filter-employee",
        field: "employee",
        operator: "=",
        value: employeeId,
        fieldCategory: "Timesheet",
      },
    ]),
  )}`;
}
