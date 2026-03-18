/**
 * External dependencies.
 */
import { cva } from "class-variance-authority";
import {
  Circle,
  CircleCheckBig,
  CircleX,
  ClipboardClock,
  Loader,
} from "lucide-react";

/**
 * Internal dependencies.
 */
import { Overdue } from "../../icons/overdue";

export type TaskStatus =
  | "open"
  | "working"
  | "pending-rev"
  | "overdue"
  | "completed"
  | "cancelled";

export const taskStatusMap: Record<string, TaskStatus> = {
  Open: "open",
  Working: "working",
  "Pending Review": "pending-rev",
  Overdue: "overdue",
  Completed: "completed",
  Cancelled: "cancelled",
};

export type TaskRowTimeEntry = {
  time: string;
  nonBillable?: boolean;
  disabled?: boolean;
};

export const statusIcon: Record<
  TaskStatus,
  React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>
> = {
  open: Circle,
  working: Loader,
  "pending-rev": ClipboardClock,
  overdue: Overdue,
  completed: CircleCheckBig,
  cancelled: CircleX,
};

export const statusIconVariants = cva("", {
  variants: {
    status: {
      open: "text-ink-gray-3",
      working: "text-ink-gray-9",
      "pending-rev": "text-ink-gray-9",
      overdue: "text-ink-red-4",
      completed: "text-ink-gray-9",
      cancelled: "text-ink-gray-9",
    },
  },
});
