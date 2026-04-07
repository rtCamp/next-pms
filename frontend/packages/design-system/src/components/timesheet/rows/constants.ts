/**
 * External dependencies.
 */
import { BadgeProps, ButtonVariant } from "@rtcamp/frappe-ui-react";
import { cva } from "class-variance-authority";
import { CircleCheck, CircleX, Hourglass, Send } from "lucide-react";

/**
 * Internal dependencies.
 */
import { TaskStatusType } from "@/components/task-status";

export type ApprovalStatusType =
  | "not-submitted"
  | "approved"
  | "rejected"
  | "approval-pending"
  | "partially-approved"
  | "partially-rejected"
  | "none";

export type ApprovalStatusLabelType =
  | "Not Submitted"
  | "Approved"
  | "Rejected"
  | "Approval Pending"
  | "None"
  | "Partially Approved"
  | "Partially Rejected"
  | "Processing Timesheet";

export const ApprovalStatusLabelMap: Record<
  ApprovalStatusType,
  ApprovalStatusLabelType
> = {
  "not-submitted": "Not Submitted",
  approved: "Approved",
  rejected: "Rejected",
  "approval-pending": "Approval Pending",
  "partially-approved": "Partially Approved",
  "partially-rejected": "Partially Rejected",
  none: "None",
};

export const ApprovalStatusMap: Record<
  ApprovalStatusLabelType,
  ApprovalStatusType
> = {
  "Not Submitted": "not-submitted",
  Approved: "approved",
  Rejected: "rejected",
  "Approval Pending": "approval-pending",
  "Partially Approved": "partially-approved",
  "Partially Rejected": "partially-rejected",
  "Processing Timesheet": "approval-pending",
  None: "none",
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

export const approvalStatusTheme: Record<
  ApprovalStatusType,
  BadgeProps["theme"]
> = {
  "not-submitted": "gray",
  approved: "green",
  rejected: "red",
  "approval-pending": "orange",
  "partially-approved": "green",
  "partially-rejected": "red",
  none: "gray",
};

export const approvalStatusIcon: Record<
  ApprovalStatusType,
  {
    variant: ButtonVariant;
    icon: React.ComponentType<{ size?: number }> | null;
  }
> = {
  "not-submitted": {
    variant: "solid",
    icon: Send,
  },
  approved: {
    variant: "ghost",
    icon: CircleCheck,
  },
  rejected: {
    variant: "ghost",
    icon: CircleX,
  },
  "approval-pending": {
    variant: "ghost",
    icon: Hourglass,
  },
  "partially-approved": {
    variant: "ghost",
    icon: CircleCheck,
  },
  "partially-rejected": {
    variant: "ghost",
    icon: CircleX,
  },
  none: {
    variant: "ghost",
    icon: null,
  },
};
