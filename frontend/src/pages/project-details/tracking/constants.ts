import type { Role } from "@/session";
import type { WidgetKey } from "./types";

export const TRACKING_METHOD =
  "/api/v2/method/next_pms.next_projects.api.project.get_project_tracking";
export const VIEW_API =
  "/api/v2/method/next_pms.timesheet.doctype.pms_view_setting.pms_view_setting";

/** Who may change the layout; the backend's `TRACKING_LAYOUT_ROLES`. */
export const CUSTOMIZATION_ROLES: Role[] = ["Projects Manager"];

export const CUSTOMIZABLE_WIDGETS: { key: WidgetKey; label: string }[] = [
  { key: "task_completion", label: "Task completion" },
  { key: "budget_burn", label: "Budget burn" },
  { key: "cost_burn", label: "Cost burn" },
];

export const WIDGET_KEYS: WidgetKey[] = [
  "financials",
  "task_completion",
  "hours_usage",
  "invoice_burn",
  "budget_burn",
  "cost_burn",
  "lifetime_to_date",
  "lifetime_expected",
  "lifetime_vs_billed",
  "contracts",
  "rates",
];

export const ROW_COLUMNS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
};

export const DATE_FORMAT = "MMM D, YYYY";
