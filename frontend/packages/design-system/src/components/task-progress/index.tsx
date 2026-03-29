import React from "react";
import type { TaskProgressProps } from "./types";
import { mergeClassNames as cn } from "../../utils";

export type { TaskProgressProps } from "./types";

const MIN_VALUE = 0;
const MAX_VALUE = 100;
const OVERFLOW_COLOR = "bg-surface-red-6";

const TaskProgress: React.FC<TaskProgressProps> = ({
  value,
  className = "",
}) => {
  const isOverflow = value > MAX_VALUE;
  const baseWidth = isOverflow ? (MAX_VALUE / value) * 100 : value;
  const overflowWidth = isOverflow ? ((value - MAX_VALUE) / value) * 100 : 0;

  return (
    <div
      className={cn("h-4 rounded-sm bg-surface-gray-2", className)}
      aria-valuemax={MAX_VALUE}
      aria-valuemin={MIN_VALUE}
      aria-valuenow={value}
      role="progressbar"
    >
      <div className="flex w-full h-full">
        <div
          className="h-full rounded-l-sm bg-surface-gray-4"
          style={{ width: `${baseWidth}%` }}
        />
        {isOverflow && (
          <div
            className={cn(
              "relative h-full rounded-r-sm",
              OVERFLOW_COLOR,
              "before:content-[''] before:absolute before:bg-outline-gray-5 before:left-0 before:bottom-0 before:h-[160%] before:w-px",
            )}
            style={{ width: `${overflowWidth}%` }}
          />
        )}
      </div>
    </div>
  );
};

export default TaskProgress;
