/**
 * External dependencies
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { floatToTime } from "@next-pms/design-system";
import {
  TaskRow as BaseTaskRow,
  taskStatusMap,
} from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";

/**
 * Internal dependencies
 */
import { CalendarFoldIcon, Folder } from "lucide-react";
import TaskPopover from "@/components/taskPopover";
import { calculateTotalHours } from "@/lib/utils";
import type { TaskRowProps } from "./types";
import { InlineTimeEntry } from "../inline-time-entry";

const MOCK_END_DATE = "2024-12-31";

/**
 * @description This is the task row component for the timesheet table.
 * It is responsible for rendering the task row of the timesheet table.
 *
 * @param {Array} props.dates - Array of date strings for the week.
 * @param {string} props.taskKey - Key of the task to be rendered.
 * @param {TaskProps} props.tasks - TaskProps object containing task data for the week.
 * @param {string} props.status - Status of the task.
 * @param {Array} props.likedTaskData - Array of liked task data to determine if the task is liked or not.
 * @param {boolean} props.disabled - Whether the task row is disabled.
 * @param {number} props.dailyWorkingHours - Daily working hours for the task.
 * @param {string} props.employee - Employee for the timesheet entry.
 */
export const TaskRow = ({
  dates,
  taskKey,
  tasks,
  status,
  likedTaskData,
  disabled,
  dailyWorkingHours,
  totalTimeEntriesInHours,
  employee,
  ...rest
}: TaskRowProps) => {
  const [taskLiked, setTaskLiked] = useState(false);

  const taskData = useMemo(() => {
    let total = 0;
    const totalTimeEntries = [];
    for (const date of dates) {
      const currentTotal = calculateTotalHours(tasks, date);
      totalTimeEntries.push({
        time: currentTotal === 0 ? "" : floatToTime(currentTotal, 2),
        nonBillable:
          currentTotal === 0 || (taskKey && tasks[taskKey]?.is_billable)
            ? false
            : true,
        disabled: disabled || false,
      });
      total += currentTotal;
    }
    return { total, totalTimeEntries };
  }, [dates, taskKey, tasks, disabled]);

  const renderTaskHoverContent = useCallback(
    (taskKey: string) => {
      const task = tasks[taskKey];

      const badges = [
        {
          icon: <CalendarFoldIcon size={12} />,
          text: prettyDate(task?.due_date || MOCK_END_DATE).date,
        },
        {
          icon: <Folder size={12} />,
          text: task?.project_name || "",
        },
      ];

      return (
        <TaskPopover
          label={rest.label}
          badges={badges}
          actualHours={task?.actual_time || 0}
          estimatedHours={task?.expected_time || 0}
          status={taskStatusMap[status] ?? "open"}
        />
      );
    },
    [rest.label, tasks, status],
  );

  useEffect(() => {
    setTaskLiked(likedTaskData.some((obj) => obj.name === taskKey) || false);
  }, [likedTaskData, taskKey]);

  return (
    <BaseTaskRow
      {...rest}
      status={taskStatusMap[status] ?? "open"}
      totalHours={floatToTime(taskData.total, 2)}
      timeEntries={taskData.totalTimeEntries}
      starred={taskLiked}
      renderTaskHoverContent={renderTaskHoverContent}
      taskKey={taskKey}
      renderInlineTimeEntryPopover={(_, dayIndex, closePopover) => (
        <InlineTimeEntry
          dailyWorkingHours={dailyWorkingHours}
          totalUsedHoursInDay={totalTimeEntriesInHours?.[dayIndex]}
          isBillable={
            taskData.totalTimeEntries[dayIndex]?.nonBillable === false
          }
          date={dates[dayIndex]}
          task={taskKey}
          employee={employee ?? ""}
          onSubmitSuccess={closePopover}
        />
      )}
    />
  );
};
