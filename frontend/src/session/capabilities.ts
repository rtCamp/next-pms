/** How far a capability reaches: the user's own records, their reports, their reports and their projects, or everyone's. */
export type CapabilityScope =
  "own" | "reports" | "reports_and_own_projects" | "all";

/** A capability from the server's `CAPABILITIES` map (`next_pms/permissions/capabilities.py`). */
export type Capability =
  | "open_app"
  | "edit_others_time"
  | "view_others_timesheets"
  | "approve_week"
  | "approve_project_timesheets"
  | "be_timesheet_approver"
  | "team_timesheet_pages"
  | "view_employee_details"
  | "manager_dashboard"
  | "approve_leaves"
  | "leadership_dashboard"
  | "allocation_widgets"
  | "projects_page"
  | "view_project_financials"
  | "view_cost_and_invoice_burn"
  | "edit_project_billing"
  | "project_admin"
  | "view_allocations"
  | "manage_allocations"
  | "manage_ai_allocations"
  | "view_resource_cost"
  | "view_team_leaves"
  | "system_settings"
  | "public_views"
  | "filter_lookups"
  | "notifications";

/** The user's capabilities and their scopes, resolved from their roles on the server. */
export type Capabilities = Partial<Record<Capability, CapabilityScope>>;

export function hasCapability(
  capabilities: Capabilities,
  capability: Capability,
): boolean {
  return Boolean(capabilities[capability]);
}
