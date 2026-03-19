/**
 * External dependencies.
 */
import { cva } from "class-variance-authority";

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
