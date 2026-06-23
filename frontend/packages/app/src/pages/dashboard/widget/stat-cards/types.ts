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
