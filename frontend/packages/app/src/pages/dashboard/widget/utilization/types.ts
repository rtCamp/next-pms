export interface TimeUtilisationResponse {
  message: {
    billable_hours: number;
    non_billable_hours: number;
    total_hours: number;
  };
}
