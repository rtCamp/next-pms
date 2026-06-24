/**
 * External dependencies.
 */
import React from "react";
import { mergeClassNames as cn } from "@next-pms/design-system/utils";
import { StaticTextEditor } from "@rtcamp/frappe-ui-react";
import { format, parseISO } from "date-fns";

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
        "flex overflow-y-auto flex-col gap-3 mt-3 max-h-54 scrollbar-thin pr-3 -mr-3",
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
    <div className="pb-1 border-b border-outline-gray-modals text-ink-gray-6 last:border-none">
      <div className="flex justify-between items-center mb-1">
        <TimeBadge employee={employee} hours={hours} showAvatar={showAvatar} />
        <span className="text-base">{format(parseISO(date), "dd MMM")}</span>
      </div>

      <StaticTextEditor
        content={description}
        editorClass="max-h-30 prose-sm overflow-auto scrollbar-thin text-ink-gray-7 text-base leading-5.25"
      />
    </div>
  );
};

export default TaskEntryList;
