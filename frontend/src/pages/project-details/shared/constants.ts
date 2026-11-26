import type { Role } from "@/session";

export const GET_LIST_URL = "/api/v2/method/frappe.client.get_list";
export const USER_DETAILS_URL =
  "/api/v2/method/next_pms.next_projects.api.user.get_user_details";
export const ACTIVITY_URL =
  "/api/v2/method/next_pms.next_projects.api.activity.get_activity";
export const UPDATE_FOLLOW_URL =
  "/api/v2/method/frappe.desk.form.document_follow.update_follow";

/** The role that may edit or delete anyone's update. */
export const UPDATE_ADMIN_ROLE: Role = "System Manager";

export const ATTACHMENT_LIMIT = 50;
export const FOLLOWER_LIMIT = 50;
export const FOLLOWERS_SHOWN = 3;

/** The audit fields of an update log row, stamped by the server. */
export const UPDATE_LOG_AUDIT_FIELDS = ["updated_at", "updated_by"] as const;
