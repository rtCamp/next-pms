export type ProjectSummary = {
  name: string;
  project_name: string;
  customer: string;
  total_hours_purchased: number;
  actual_time: number;
  total_hours_remaining: number;
  billable_hours: number;
  non_billable_hours: number;
};

export type ProjectSummaryResponse = {
  message: ProjectSummary[];
};

export type AssignedProject = {
  name: string;
  projectName: string;
  customer: string;
  remaining: number;
  used: number;
  total: number;
  billableLastWeek: number;
  nonBillableLastWeek: number;
};
