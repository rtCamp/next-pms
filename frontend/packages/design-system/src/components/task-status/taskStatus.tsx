/**
 * Internal dependencies.
 */
import { statusIcon, statusIconVariants } from "./constants";
import type { TaskStatusType } from "./types";
import { mergeClassNames as cn } from "../../utils";

export type { TaskStatusType } from "./types";
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
