export interface CalendarItemOwner {
  user: string;
  full_name: string;
  image: string | null;
}

export interface CalendarItem {
  name: string;
  title: string;
  project: string;
  type: string;
  is_complete: 0 | 1;
  start_date: string;
  planned_end_date: string;
  actual_end_date: string | null;
  is_overdue: boolean;
  owner: CalendarItemOwner;
  watchers: string[];
}

export interface CalendarTimelineResponse {
  message: {
    data: CalendarItem[];
  };
}

export interface ProjectSummary {
  name: string;
  project_name: string;
  customer: string;
  total_hours_purchased: number;
  actual_time: number;
  total_hours_remaining: number;
  billable_hours: number;
  non_billable_hours: number;
}

export type MyProjectsSummaryResponse = { message: ProjectSummary[] };

export interface EmployeeOnLeave {
  employee: string;
  employee_name: string;
  from_date: string;
  to_date: string;
}

export type EmployeesOnLeaveResponse = { message: EmployeeOnLeave[] };

export interface TimesheetStatus {
  name: string;
  status: string;
}

export interface TeamTimesheetEntry {
  employee: string;
  employee_name: string;
  user_image: string | null;
  billable_hours: number;
  non_billable_hours: number;
  expected_hours: number;
  delta: number;
  timesheet_statuses: TimesheetStatus[];
}

export type TeamTimesheetsResponse = { message: TeamTimesheetEntry[] };
