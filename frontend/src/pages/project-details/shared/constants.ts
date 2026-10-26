import type { Role } from "@/session";

export const GET_LIST_URL = "/api/v2/method/frappe.client.get_list";
export const USER_DETAILS_URL =
  "/api/v2/method/next_pms.next_projects.api.user.get_user_details";
export const UPDATE_FOLLOW_URL =
  "/api/v2/method/frappe.desk.form.document_follow.update_follow";

/** Roles that may edit and delete every owner-gated record. */
export const MANAGE_ALL_ROLES = [
  "System Manager",
  "Projects Manager",
  "Delivery Manager",
  "Delivery User",
  "Timesheet Manager",
] as const satisfies readonly Role[];

/** Roles that may edit an owner-gated record only when they own it. */
export const OWNER_GATED_ROLES = [
  "Projects User",
] as const satisfies readonly Role[];

/** The role that may edit or delete anyone's update. */
export const UPDATE_ADMIN_ROLE: Role = "System Manager";

export const ATTACHMENT_LIMIT = 50;
export const FOLLOWER_LIMIT = 50;
export const FOLLOWERS_SHOWN = 3;

/** The audit fields of an update log row, stamped by the server. */
export const UPDATE_LOG_AUDIT_FIELDS = ["updated_at", "updated_by"] as const;
