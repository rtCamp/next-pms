import type { BadgeProps } from "frappe-ui";
import type { ApprovalStatus, TaskRowStatus } from "./types";

type ButtonVariant = "solid" | "subtle" | "outline" | "ghost";

/** Shared layout so every row lines its columns up with the header. */
export const ROW_CLASS =
  "flex w-full items-center justify-between border-b border-outline-gray-1 px-1 py-2 transition-colors";
export const CELL_CLASS =
  "flex h-7 w-16 shrink-0 items-center justify-end whitespace-nowrap px-2 py-1.5 leading-[0.875rem]";
export const ACTION_CELL_CLASS =
  "flex h-7 w-12 shrink-0 items-center justify-end whitespace-nowrap";
export const EMPTY_CELL_CLASS = "ml-2 flex-1 text-center text-ink-gray-4";

export const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  "not-submitted": "Not Submitted",
  approved: "Approved",
  rejected: "Rejected",
  "approval-pending": "Approval Pending",
  none: "None",
};

export const APPROVAL_STATUS_THEME: Record<
  ApprovalStatus,
  NonNullable<BadgeProps["theme"]>
> = {
  "not-submitted": "gray",
  approved: "green",
  rejected: "red",
  "approval-pending": "amber",
  none: "gray",
};

interface StatusAction {
  variant: ButtonVariant;
  icon: string | null;
  /** Accessible name of the action button. */
  label: string;
}

export const WEEK_ACTION: Record<ApprovalStatus, StatusAction> = {
  "not-submitted": {
    variant: "solid",
    icon: "lucide-send",
    label: "Submit week",
  },
  approved: {
    variant: "ghost",
    icon: "lucide-circle-check",
    label: "Approved",
  },
  rejected: { variant: "ghost", icon: "lucide-circle-x", label: "Rejected" },
  "approval-pending": {
    variant: "ghost",
    icon: "lucide-hourglass",
    label: "Approval Pending",
  },
  none: { variant: "ghost", icon: null, label: "" },
};

export const MEMBER_ACTION: Record<ApprovalStatus, StatusAction> = {
  "not-submitted": { variant: "ghost", icon: null, label: "" },
  approved: {
    variant: "ghost",
    icon: "lucide-circle-check",
    label: "Approved",
  },
  rejected: { variant: "ghost", icon: "lucide-circle-x", label: "Rejected" },
  "approval-pending": {
    variant: "solid",
    icon: "lucide-circle-check",
    label: "Approve week",
  },
  none: { variant: "ghost", icon: null, label: "" },
};

/** Ghost action buttons show only the tinted icon, with no hover fill. */
export const GHOST_ACTION_CLASS =
  "hover:!bg-transparent active:!bg-transparent focus:!bg-transparent";

const STATUS_TEXT_CLASS: Record<ApprovalStatus, string> = {
  "not-submitted": "",
  approved: "text-ink-green-4",
  rejected: "text-ink-red-4",
  "approval-pending": "text-ink-amber-4",
  none: "",
};

/** Colour of the collapsed week's total. A past week still pending turns red. */
export const WEEK_TOTAL_CLASS: Record<ApprovalStatus, string> = {
  ...STATUS_TEXT_CLASS,
  "not-submitted": "text-ink-green-4",
};

export const MEMBER_TOTAL_CLASS: Record<ApprovalStatus, string> = {
  ...STATUS_TEXT_CLASS,
  none: "text-ink-green-4",
};

/** Colour of the total in project and total rows. */
export const TOTAL_TEXT_CLASS: Record<ApprovalStatus, string> = {
  ...STATUS_TEXT_CLASS,
  "not-submitted": "text-ink-gray-6",
};

/** Icon tint of a ghost action button; `!` beats the Button's own text colour. */
export const ACTION_TEXT_CLASS: Record<ApprovalStatus, string> = {
  "not-submitted": "",
  approved: "!text-ink-green-4",
  rejected: "!text-ink-red-4",
  "approval-pending": "!text-ink-amber-4",
  none: "",
};

export const TASK_STATUS_ICON: Record<TaskRowStatus, string> = {
  open: "lucide-circle",
  working: "lucide-loader",
  "pending-rev": "lucide-clipboard-clock",
  overdue: "lucide-clock-12",
  completed: "lucide-circle-check-big",
  cancelled: "lucide-circle-x",
};

export const TASK_STATUS_ICON_CLASS: Record<TaskRowStatus, string> = {
  open: "text-ink-gray-3",
  working: "text-ink-gray-9",
  "pending-rev": "text-ink-gray-9",
  overdue: "text-ink-red-4",
  completed: "text-ink-gray-9",
  cancelled: "text-ink-gray-9",
};

export const TASK_STATUS_LABEL: Record<TaskRowStatus, string> = {
  open: "Open",
  working: "Working",
  "pending-rev": "Pending Review",
  overdue: "Overdue",
  completed: "Completed",
  cancelled: "Cancelled",
};
