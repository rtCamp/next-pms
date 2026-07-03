export interface TimeUtilisationRole {
  designation: string;
  billable_hours: number;
  non_billable_hours: number;
  total_hours: number;
}

export interface TimeUtilisationResponse {
  message: {
    days: number;
    start_date: string;
    end_date: string;
    roles: TimeUtilisationRole[];
  };
}
