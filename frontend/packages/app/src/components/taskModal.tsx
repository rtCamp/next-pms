import {
  TaskProgress,
  TaskStatus,
  type TaskStatusType,
} from "@next-pms/design-system/components";
import {
  mergeClassNames as cn,
  floatToTime,
} from "@next-pms/design-system/utils";
import { Avatar, Badge, Dialog, Select } from "@rtcamp/frappe-ui-react";

type BadgeItem = {
  icon: React.ReactNode;
  text: string;
};

type TaskModalProps = {
  open: boolean;
  status: TaskStatusType;
  label: string;
  badges?: BadgeItem[];
  actualHours: number;
  estimatedHours: number;
  onOpenChange: (open: boolean) => void;
};

const TaskModal: React.FC<TaskModalProps> = ({
  open,
  status,
  label,
  badges,
  actualHours,
  estimatedHours,
  onOpenChange,
}) => {
  // Calculate progress percentage
  const progress =
    estimatedHours === 0 ? 0 : Math.round((actualHours / estimatedHours) * 100);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      options={{
        title: () => {
          return (
            <div className="flex items-center gap-x-2 gap-y-1.5">
              <TaskStatus status={status} />
              <div className="text-lg font-semibold">{label}</div>
            </div>
          );
        },
        size: "md",
      }}
    >
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1 -mt-5.5 ml-6">
          {badges.map((badge, index) => (
            <Badge key={index} variant="subtle" size="md" prefix={badge.icon}>
              {badge.text}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-4 text-base">
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
            <span>{floatToTime(estimatedHours, 2)}</span>
            <span className="text-ink-gray-5">Est.</span>
          </div>
        </div>

        <div className="text-ink-gray-6">{progress}%</div>
      </div>

      <TaskProgress value={progress} className="mt-2.5" />

      <div className="flex justify-between items-center mt-6">
        <div className="flex justify-between items-center rounded bg-surface-gray-2 px-2 py-1.5 gap-1">
          <Avatar size="xs" label="PK" />
          <span className="text-base">06:00</span>
        </div>

        <Select
          className="w-auto"
          onChange={() => {}}
          options={[
            {
              label: "Last 30 days",
              value: "last-30-days",
            },
            {
              label: "Last month",
              value: "last-month",
            },
            {
              label: "Last 3 months",
              value: "last-3-months",
            },
          ]}
          placeholder="Select option"
          value="last-30-days"
        />
      </div>

      <div className="flex overflow-y-auto flex-col gap-3 mt-3 h-54 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-surface-gray-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="pb-3 border-b border-outline-gray-modals text-ink-gray-6 last:border-none"
          >
            <div className="flex justify-between items-center">
              <Badge variant="subtle" size="md">
                01:30
              </Badge>
              <span className="text-base">23 Jan</span>
            </div>

            <p className="mt-1 text-base">
              Updated button variants, adjusted hover states and
            </p>
          </div>
        ))}
      </div>
    </Dialog>
  );
};

export default TaskModal;
