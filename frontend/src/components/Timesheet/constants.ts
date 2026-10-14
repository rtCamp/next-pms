import { cva } from "class-variance-authority";
import type { BadgeProps } from "frappe-ui";
import type { ApprovalStatusValue } from "@/components/ApprovalStatus";

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
