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
