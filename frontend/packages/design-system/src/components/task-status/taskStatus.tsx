/**
 * External dependencies.
 */
import { cva } from "class-variance-authority";
import {
  Circle,
  CircleCheckBig,
  CircleX,
  ClipboardClock,
  Clock12,
  Loader,
} from "lucide-react";

/**
 * Internal dependencies.
 */
import type { TaskStatusType } from "./types";
import { mergeClassNames as cn } from "../../utils";

export type { TaskStatusType } from "./types";

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
  overdue: Clock12,
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

interface TaskStatusProps {
  status: TaskStatusType;
  className?: string;
}

const TaskStatus = ({ status, className }: TaskStatusProps) => {
  const StatusIcon = statusIcon[status];

  return (
    <span className={cn("w-4 shrink-0", className)}>
      <StatusIcon
        strokeWidth={1.5}
        size={16}
        className={statusIconVariants({ status })}
      />
    </span>
  );
};

export default TaskStatus;
