import type { ManagerRole } from "./types";

export const SIDEBAR_METHOD =
  "/api/v2/method/next_pms.next_projects.api.project.get_project_sidebar";
export const SHARE_ADD_METHOD = "/api/v2/method/frappe.share.add";
export const SHARE_SET_PERMISSION_METHOD =
  "/api/v2/method/frappe.share.set_permission";

/** `project_roles` values from `get_project_sidebar`. */
export const PROJECT_MANAGER_ROLE = "Project Manager";
export const ENGINEERING_MANAGER_ROLE = "Engineering Manager";

export const MANAGER_FIELDS: Record<
  ManagerRole,
  "custom_project_manager" | "custom_engineering_manager"
> = {
  project_manager: "custom_project_manager",
  engineering_manager: "custom_engineering_manager",
};

/** How the sidebar names a project role. */
export const ROLE_LABELS: Record<string, string> = {
  [PROJECT_MANAGER_ROLE]: "Project Manager",
  [ENGINEERING_MANAGER_ROLE]: "Lead Engineer",
};

/** Rows an expandable list shows before "+N more". */
export const VISIBLE_ROWS = 3;

/** Hover card open and close delays, in ms. */
export const HOVER_OPEN_DELAY = 300;
export const HOVER_CLOSE_DELAY = 150;

export const SECTIONS = [
  { value: "summary", title: "Summary" },
  { value: "details", title: "Project details" },
  { value: "links", title: "Links" },
  { value: "budget", title: "Budget burn" },
  { value: "progress", title: "Progress (hours)" },
  { value: "members", title: "Members" },
  { value: "customers", title: "Customers" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["value"];
