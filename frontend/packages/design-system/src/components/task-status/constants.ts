/**
 * External dependencies.
 */
import { Overdue } from "@rtcamp/frappe-ui-react/icons";
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
import type { TaskStatusType } from "./types";

export const statusIcon: Record<
  TaskStatusType,
  React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>
> = {
  open: Circle,
  working: Loader,
  pendingReview: ClipboardClock,
  overdue: Overdue,
  completed: CircleCheckBig,
  cancelled: CircleX,
  template: Circle,
};

export const statusIconVariants = cva("", {
  variants: {
    status: {
      open: "text-ink-gray-3",
      working: "text-ink-gray-9",
      pendingReview: "text-ink-gray-9",
      overdue: "text-ink-red-4",
      completed: "text-ink-gray-9",
      cancelled: "text-ink-gray-9",
      template: "text-ink-gray-9",
    },
  },
});
