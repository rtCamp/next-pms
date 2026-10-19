import { cva } from "class-variance-authority";
import type { BadgeProps } from "frappe-ui";
import { CommentKit } from "frappe-ui/editor";
import {
  APPROVAL_STATUSES,
  type ApprovalStatusValue,
} from "@/components/ApprovalStatus";
import { TASK_STATUSES, type TaskStatusValue } from "@/components/TaskStatus";
import type {
  HoursComparison,
  TimesheetApprovalStatus,
  TotalHoursTheme,
} from "./types";

/** Shared layout so every row lines its columns up with the header. */
export const ROW_CLASS =
  "flex w-full items-center justify-between border-b border-outline-gray-1 px-1 py-2 transition-colors";
export const CELL_CLASS =
  "flex h-7 w-16 shrink-0 items-center justify-end whitespace-nowrap px-2 py-1.5";
/** A cell holding a `TimeCell` button, which brings its own right padding. */
export const BUTTON_CELL_CLASS =
  "flex h-7 w-16 shrink-0 items-center justify-end whitespace-nowrap pl-2";
export const ACTION_CELL_CLASS =
  "flex h-7 w-12 shrink-0 items-center justify-end whitespace-nowrap";

export const APPROVAL_STATUS_BADGE: Record<
  ApprovalStatusValue,
  { label: string; theme: NonNullable<BadgeProps["theme"]> }
> = {
  "Not Submitted": { label: "Not submitted", theme: "gray" },
  "Approval Pending": { label: "Approval pending", theme: "amber" },
  Approved: { label: "Approved", theme: "green" },
  Rejected: { label: "Rejected", theme: "red" },
  "Partially Approved": { label: "Partially approved", theme: "green" },
  "Partially Rejected": { label: "Partially rejected", theme: "red" },
  "Processing Timesheet": { label: "Processing timesheet", theme: "amber" },
};

/** Weeks in these states can be (re)submitted, with this action label. */
export const SUBMIT_ACTION_LABEL: Partial<Record<ApprovalStatusValue, string>> =
  {
    "Not Submitted": "Submit for approval",
    Rejected: "Resubmit for approval",
    "Partially Approved": "Resubmit for approval",
    "Partially Rejected": "Resubmit for approval",
  };

/** Status of a row without one; hides the badge and the action. */
export const NO_APPROVAL_STATUS = "None";

/** Whether a week in this status can be (re)submitted for approval. */
export function canSubmitForApproval(
  status: TimesheetApprovalStatus | null | undefined,
): boolean {
  return Boolean(
    status && status !== NO_APPROVAL_STATUS && SUBMIT_ACTION_LABEL[status],
  );
}

/**
 * The status a row shows: the backend value, or `undefined` for `"None"`, a missing
 * status or a value the app doesn't know.
 */
export function toApprovalStatus(
  status: string | null | undefined,
): ApprovalStatusValue | undefined {
  return APPROVAL_STATUSES.find((value) => value === status);
}

/**
 * Approval statuses as kebab-case URL values (`?approval=not-submitted,approved`), the
 * format the React pages wrote, so old links keep working.
 */
export const APPROVAL_STATUS_PARAMS: Record<ApprovalStatusValue, string> = {
  "Not Submitted": "not-submitted",
  "Approval Pending": "approval-pending",
  Approved: "approved",
  Rejected: "rejected",
  "Partially Approved": "partially-approved",
  "Partially Rejected": "partially-rejected",
  "Processing Timesheet": "processing",
};

/** The approval status for a kebab-case URL value, or `undefined` for an unknown one. */
export function approvalStatusFromParam(
  param: string,
): ApprovalStatusValue | undefined {
  return APPROVAL_STATUSES.find(
    (status) => APPROVAL_STATUS_PARAMS[status] === param,
  );
}

/** A task's status as the task rows show it; anything unknown shows as `Open`. */
export function toTaskStatus(
  status: string | null | undefined,
): TaskStatusValue {
  return TASK_STATUSES.find((value) => value === status) ?? "Open";
}

/** Colour of a total by how it compares with the hours expected. */
export const TOTAL_HOURS_THEME: Record<HoursComparison, TotalHoursTheme> = {
  short: "red",
  met: "green",
  over: "amber",
  none: "gray",
};

/** Statuses whose action is a solid button with its own icon, not the status icon. */
export const SOLID_ACTION_ICON: Partial<Record<ApprovalStatusValue, string>> = {
  "Not Submitted": "lucide-send",
};
export const MEMBER_SOLID_ACTION_ICON: Partial<
  Record<ApprovalStatusValue, string>
> = {
  ...SOLID_ACTION_ICON,
  "Approval Pending": "lucide-check",
};

export const totalHoursClass = cva("lining-nums tabular-nums", {
  variants: {
    theme: {
      green: "text-ink-green-8",
      red: "text-ink-red-8",
      amber: "text-ink-amber-8",
      gray: "text-ink-gray-6",
    },
    weight: {
      regular: "text-base",
      medium: "text-base-medium",
    },
  },
  defaultVariants: { theme: "gray", weight: "medium" },
});

/** Colour of a task cell's time by the day's approval status. */
export const TIME_ENTRY_STATUS_CLASS: Partial<
  Record<ApprovalStatusValue, string>
> = {
  Approved: "text-ink-green-8",
  Rejected: "text-ink-red-8",
  "Approval Pending": "text-ink-amber-8",
  "Processing Timesheet": "text-ink-amber-8",
  "Partially Approved": "text-ink-green-8",
  "Partially Rejected": "text-ink-red-8",
};

/** Hours a day the time-entry forms allow when the employee's are unknown. */
export const FALLBACK_DAILY_WORKING_HOURS = 8;

/** The time-entry comment editor's kit: the React editor had no media, mentions, tags or emoji. */
export const TIME_ENTRY_COMMENT_KIT = CommentKit.configure({
  mention: false,
  tag: false,
  emoji: false,
  image: false,
  imageGroup: false,
  imageViewer: false,
  video: false,
  attachment: false,
});
