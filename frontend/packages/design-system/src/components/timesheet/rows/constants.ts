/**
 * External dependencies.
 */
import { cva } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import { TaskStatusType } from "@/components/task-status";

export type RowStatus =
  | "not-submitted"
  | "approved"
  | "rejected"
  | "approval-pending"
  | "none";

export type RowStatusLabel =
  | "Not Submitted"
  | "Approved"
  | "Rejected"
  | "Approval Pending"
  | "None"
  | "Partially Approved"
  | "Partially Rejected"
  | "Processing Timesheet";

export const statusLabelMap: Record<RowStatus, RowStatusLabel> = {
  "not-submitted": "Not Submitted",
  approved: "Approved",
  rejected: "Rejected",
  "approval-pending": "Approval Pending",
  none: "None",
};

export const statusMap: Record<RowStatusLabel, RowStatus> = {
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

export type TotalHoursTheme = "green" | "red" | "amber" | "gray";

export const totalHoursThemeMap: Record<number, TotalHoursTheme> = {
  0: "red",
  1: "green",
  2: "amber",
  3: "gray",
};

export const totalHoursVariants = cva("text-base lining-nums tabular-nums", {
  variants: {
    theme: {
      green: "text-ink-green-4",
      red: "text-ink-red-4",
      amber: "text-ink-amber-4",
      gray: "text-ink-gray-6",
    },
    weight: {
      default: "", // Default weight 420
      medium: "font-medium",
    },
  },
  defaultVariants: { theme: "gray", weight: "medium" },
});
