/**
 * External dependencies
 */
import React from "react";
import { TaskStatus } from "@next-pms/design-system/components";
import { TaskProgress } from "@next-pms/design-system/components";
import {
  mergeClassNames as cn,
  floatToTime,
} from "@next-pms/design-system/utils";
import { Badge } from "@rtcamp/frappe-ui-react";
import { TaskStatusType } from "@/types/task";

type BadgeItem = {
  icon: React.ReactNode;
  text: string;
};

export type TaskPopoverProps = {
  label: string;
  badges: BadgeItem[];
  actualHours: number;
  estimatedHours: number;
  status: TaskStatusType;
};

const TaskPopover: React.FC<TaskPopoverProps> = ({
  label,
  badges,
  actualHours,
  estimatedHours,
  status,
}) => {
  // Calculate progress percentage
  const progress =
    estimatedHours === 0 ? 0 : Math.round((actualHours / estimatedHours) * 100);

  return (
    <div className="p-3 rounded-xl shadow-2xl bg-surface-modal w-88">
      <div className="grid grid-cols-[min-content_auto] items-center gap-x-2 gap-y-1.5 mb-6">
        <TaskStatus status={status} className="col-start-1 col-end-2" />
        <div className="col-start-2 col-end-3 text-base font-semibold">
          {label}
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap col-start-2 col-end-3 gap-1">
            {badges.map((badge, index) => (
              <Badge key={index} variant="subtle" size="md" prefix={badge.icon}>
                {badge.text}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between text-base">
        <div className="flex gap-0.75 mb-0.5">
          <div className="flex gap-1">
            <span
              className={cn(
                "font-medium",
                progress > 100 && "text-surface-red-7",
              )}
            >
              {floatToTime(actualHours, 2)}
            </span>
            <span className="text-ink-gray-5">Actual</span>
          </div>
          <span className="text-ink-gray-5">/</span>
          <div className="flex gap-1">
            <span className="font-medium">
              {floatToTime(estimatedHours, 2)}
            </span>
            <span className="text-ink-gray-5">Est.</span>
          </div>
        </div>

        <div className="text-ink-gray-6">{progress}%</div>
      </div>

      <TaskProgress value={progress} className="mt-2.5" />
    </div>
  );
};

export default TaskPopover;
