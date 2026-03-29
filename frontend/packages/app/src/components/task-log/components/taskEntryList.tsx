/**
 * External dependencies.
 */
import React from "react";
import { prettyDate } from "@next-pms/design-system";
import { mergeClassNames as cn } from "@next-pms/design-system/utils";

/**
 * Internal dependencies.
 */
import { TaskLog, TaskWorker } from "../types";
import TimeBadge from "./timeBadge";

type TaskEntryListProps = {
  taskLogs: TaskLog[] | null;
  className?: string;
  showAvatar?: boolean;
};

const TaskEntryList: React.FC<TaskEntryListProps> = ({
  taskLogs,
  className,
  showAvatar = true,
}) => {
  return (
    <div
      className={cn(
        "flex overflow-y-auto flex-col gap-3 mt-3 max-h-54 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-surface-gray-4",
        className,
      )}
    >
      {taskLogs && taskLogs.length > 0 ? (
        taskLogs.map((log, index) => (
          <TaskEntry
            key={`${index}-${log.date}`}
            date={log.date}
            employee={log.employee}
            description={log.description.join("\n")}
            hours={log.hours}
            showAvatar={showAvatar}
          />
        ))
      ) : (
        <p className="text-base text-center text-ink-gray-5">
          No time logs found for the selected date range.
        </p>
      )}
    </div>
  );
};

const TaskEntry = ({
  date,
  employee,
  description,
  hours,
  showAvatar = true,
}: {
  date: string;
  employee?: TaskWorker;
  description: string;
  hours: number;
  showAvatar?: boolean;
}) => {
  return (
    <div className="pb-3 border-b border-outline-gray-modals text-ink-gray-6 last:border-none">
      <div className="flex justify-between items-center mb-1">
        <TimeBadge employee={employee} hours={hours} showAvatar={showAvatar} />
        <span className="text-base">{prettyDate(date).date}</span>
      </div>

      <div key={description} className="whitespace-pre-wrap wrap-break-word">
        {description}
      </div>
    </div>
  );
};

export default TaskEntryList;
