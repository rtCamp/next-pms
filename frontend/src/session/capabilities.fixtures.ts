import type { Capabilities } from "./capabilities";

// What `get_user_capabilities()` returns for a user holding only that role.

export const EMPLOYEE_CAPABILITIES: Capabilities = {
  open_app: "all",
  view_allocations: "all",
  notifications: "all",
};

export const PROJECTS_USER_CAPABILITIES: Capabilities = {
  ...EMPLOYEE_CAPABILITIES,
  view_others_timesheets: "reports_and_own_projects",
  approve_week: "reports",
  approve_project_timesheets: "reports_and_own_projects",
  be_timesheet_approver: "reports_and_own_projects",
  team_timesheet_pages: "reports_and_own_projects",
  view_employee_details: "reports",
  manager_dashboard: "reports",
  approve_leaves: "reports",
  allocation_widgets: "reports",
  projects_page: "all",
  view_project_financials: "all",
  manage_allocations: "all",
  view_team_leaves: "reports",
  filter_lookups: "all",
};

export const PROJECTS_MANAGER_CAPABILITIES: Capabilities = {
  ...PROJECTS_USER_CAPABILITIES,
  edit_others_time: "all",
  view_others_timesheets: "all",
  approve_week: "all",
  approve_project_timesheets: "all",
  be_timesheet_approver: "all",
  team_timesheet_pages: "all",
  view_employee_details: "all",
  view_cost_and_invoice_burn: "all",
  edit_project_billing: "all",
  project_admin: "all",
  view_resource_cost: "all",
  view_team_leaves: "all",
  public_views: "all",
};

/** System Manager gets the same. */
export const PMS_LEADERSHIP_CAPABILITIES: Capabilities = {
  ...PROJECTS_MANAGER_CAPABILITIES,
  leadership_dashboard: "all",
  allocation_widgets: "all",
  manage_ai_allocations: "all",
  system_settings: "all",
};
