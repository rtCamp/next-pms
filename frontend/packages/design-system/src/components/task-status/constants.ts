/**
 * External dependencies.
 */
import { Overdue } from "@rtcamp/frappe-ui-react/icons";
import {
  Task,
  Tasks,
  CloseCircle,
  PendingReview,
  LoadingAlt,
} from "@rtcamp/frappe-ui-react/icons";
import { cva } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import type { TaskStatusType } from "./types";

export const statusIcon: Record<
  TaskStatusType,
  React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>
> = {
  open: Task,
  working: LoadingAlt,
  pendingReview: PendingReview,
  overdue: Overdue,
  completed: Tasks,
  cancelled: CloseCircle,
  template: Task,
};

export const statusIconVariants = cva("", {
  variants: {
    status: {
      open: "text-ink-gray-3",
      working: "text-ink-gray-8",
      pendingReview: "text-ink-gray-8",
      overdue: "text-ink-red-4",
      completed: "text-ink-gray-8",
      cancelled: "text-ink-gray-8",
      template: "text-ink-gray-8",
    },
  },
});
