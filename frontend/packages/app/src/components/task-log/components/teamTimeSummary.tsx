/**
 * External dependencies.
 */
import {
  mergeClassNames as cn,
  floatToTime,
} from "@next-pms/design-system/utils";
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { TaskWorker } from "../types";

type TeamTimeSummaryProps = {
  workers: TaskWorker[];
  className?: string;
};

const TeamTimeSummary: React.FC<TeamTimeSummaryProps> = ({
  workers,
  className,
}) => {
  if (workers.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex justify-start items-center gap-1.5 overflow-x-auto [scrollbar-width:none]",
        className,
      )}
      style={{
        maskImage:
          "linear-gradient(to right, black calc(100% - 24px), transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, black calc(100% - 24px), transparent)",
      }}
    >
      {workers.map((member) => (
        <div className="flex gap-2 justify-between items-start border border-outline-gray-modals px-2 py-1.5 rounded shrink-0">
          <Avatar size="xs" label={member.employeeName} />

          <div>
            <p className="mb-1 text-sm font-medium">{member.employeeName}</p>
            <p className="text-xs text-ink-gray-5">
              {floatToTime(member.totalHours, 2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamTimeSummary;
