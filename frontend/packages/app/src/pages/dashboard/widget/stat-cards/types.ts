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

export interface TimesheetToReview {
  name: string;
  employee: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  custom_approval_status: string;
}

export type TimesheetsToReviewResponse = { message: TimesheetToReview[] };

export interface OutstandingMember {
  employee: string;
  employee_name: string;
  timesheet_count: number;
  expected_count: number;
  missing_count: number;
  missing_dates: string[];
}

export interface OutstandingTimesheetsResponse {
  message: {
    count: number;
    days: number;
    start_date: string;
    end_date: string;
    members: OutstandingMember[];
  };
}
