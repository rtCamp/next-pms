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
