export type ActiveProjectsCountResponse = { message: number };

export type AtRiskProjectsCountResponse = { message: number };

export type NonBillableHoursResponse = { message: number };

export interface AllocationGapDate {
  date: string;
  allocated_hours: number;
  missing_hours: number;
}

export interface MemberAllocationGap {
  employee: string;
  employee_name: string;
  daily_working_hours: number;
  gap_dates: AllocationGapDate[];
}

export interface MembersWithoutAllocationResponse {
  message: {
    count: number;
    days: number;
    start_date: string;
    end_date: string;
    members: MemberAllocationGap[];
  };
}

export interface KPIMetric {
  current: number;
  previous: number;
  change_pct: number | null;
  trend: "up" | "down";
}

export interface LeadershipKPIResponse {
  message: {
    revenue: KPIMetric;
    cost: KPIMetric;
    profit_margin: KPIMetric;
  };
}

export interface WeekRange {
  week_start: string;
  week_end: string;
}

export interface RoleAllocationWeek extends WeekRange {
  capacity_hours: number;
  allocated_hours: number;
}

export interface RoleAllocation {
  designation: string;
  weeks: RoleAllocationWeek[];
}

export interface AllocationHeatmapResponse {
  message: {
    from_date: string;
    to_date: string;
    weeks: WeekRange[];
    roles: RoleAllocation[];
  };
}

export interface TimeUtilisationResponse {
  message: {
    billable_hours: number;
    non_billable_hours: number;
    total_hours: number;
  };
}

export interface ForecastRoleBreakdown {
  designation: string;
  allocated_hours: number;
  tentative_hours: number;
  unallocated_hours: number;
}

export interface ForecastBreakdownResponse {
  message: {
    days: number;
    start_date: string;
    end_date: string;
    roles: ForecastRoleBreakdown[];
  };
}

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
