import { TaskStatusType } from "@/components/task-status";

export type RowStatus =
  | "not-submitted"
  | "approved"
  | "rejected"
  | "approval-pending"
  | "none";

export const statusLabel: Record<RowStatus, string> = {
  "not-submitted": "Not Submitted",
  approved: "Approved",
  rejected: "Rejected",
  "approval-pending": "Approval Pending",
  none: "None",
};

export const statusMap: Record<string, RowStatus> = {
  "Not Submitted": "not-submitted",
  Approved: "approved",
  Rejected: "rejected",
  "Approval Pending": "approval-pending",
  None: "none",
  "Partially Approved": "approved",
  "Partially Rejected": "rejected",
  "Processing Timesheet": "approval-pending",
};

export const taskStatusMap: Record<string, TaskStatusType> = {
  Open: "open",
  Working: "working",
  "Pending Review": "pendingReview",
  Overdue: "overdue",
  Template: "template",
  Completed: "completed",
  Cancelled: "cancelled",
};
