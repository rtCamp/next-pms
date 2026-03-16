/**
 * External dependencies
 */
import React from "react";
import { ProgressV2 } from "@next-pms/design-system/components";
import { Badge } from "@rtcamp/frappe-ui-react";
import { TaskStatus } from "../../../design-system/src/components/timesheet";
import {
  statusIcon,
  statusIconVariants,
} from "../../../design-system/src/components/timesheet/rows/task/constants";
import {
  mergeClassNames as cn,
  timeToDecimalHours,
} from "../../../design-system/src/utils";

type BadgeItem = {
  icon: React.ReactNode;
  text: string;
};

type TaskPopoverProps = {
  label: string;
  badges: BadgeItem[];
  actualHours: string;
  estimatedHours: string;
  status: TaskStatus;
};

const TaskPopover: React.FC<TaskPopoverProps> = ({
  label,
  badges,
  actualHours,
  estimatedHours,
  status,
}) => {
  const StatusIcon = statusIcon[status];

  // Calculate progress percentage
  const actual = timeToDecimalHours(actualHours);
  const estimated = timeToDecimalHours(estimatedHours) || 1;
  const progress = Math.round((actual / estimated) * 100);

  return (
    <div className="p-3 rounded-xl shadow-2xl bg-surface-modal max-w-88">
      <div className="grid grid-cols-[min-content_auto] items-center gap-x-2 gap-y-1.5 mb-6">
        <StatusIcon
          strokeWidth={1.5}
          size={16}
          className={cn(
            statusIconVariants({ status }),
            "col-start-1 col-end-2 w-full shrink-0",
          )}
        />
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
            <span className="font-medium">{actualHours}</span>
            <span className="font-[420] text-ink-gray-5">Actual</span>
          </div>
          <span className="font-[420] text-ink-gray-5">/</span>
          <div className="flex gap-1">
            <span className="font-medium">{estimatedHours}</span>
            <span className="font-[420] text-ink-gray-5">Est.</span>
          </div>
        </div>

        <div className="font-[420] text-ink-gray-6">{progress}%</div>
      </div>

      <ProgressV2 value={progress} size="xxl" className="mt-2.5" />
    </div>
  );
};

export default TaskPopover;
