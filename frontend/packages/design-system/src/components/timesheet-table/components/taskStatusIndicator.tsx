/**
 * Internal dependencies
 */
import { cn } from "@design-system/utils";

interface TaskIndicatorProps {
  className?: string;
  expectedTime: number;
  actualTime: number;
  status: string;
}

export const TaskStatusIndicator = ({ className, expectedTime, actualTime, status }: TaskIndicatorProps) => {
  let color: string;

  if (status === "Completed") {
    color = "bg-gray-300";
  } else if (expectedTime === 0) {
    color = "bg-warning";
  } else if (Number(actualTime) <= Number(expectedTime)) {
    color = "bg-success";
  } else {
    color = "bg-destructive";
  }
  return <div className={cn("w-2 h-2 rounded-full my-2", color, className)} />;
};
