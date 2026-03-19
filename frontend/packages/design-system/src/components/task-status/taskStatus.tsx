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
  Open: Circle,
  Working: Loader,
  "Pending Review": ClipboardClock,
  Overdue: Clock12,
  Completed: CircleCheckBig,
  Cancelled: CircleX,
  Template: Circle,
};

export const statusIconVariants = cva("", {
  variants: {
    status: {
      Open: "text-ink-gray-3",
      Working: "text-ink-gray-9",
      "Pending Review": "text-ink-gray-9",
      Overdue: "text-ink-red-4",
      Completed: "text-ink-gray-9",
      Cancelled: "text-ink-gray-9",
      Template: "text-ink-gray-9",
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
