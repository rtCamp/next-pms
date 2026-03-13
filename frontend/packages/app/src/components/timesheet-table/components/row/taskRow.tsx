/**
 * External dependencies
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { floatToTime } from "@next-pms/design-system";
import { TaskRow as BaseTaskRow, taskStatusMap } from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { calculateTotalHours } from "@/lib/utils";
import { NewTimesheetProps } from "@/types/timesheet";
import type { TaskRowProps } from "./types";

/**
 * @description This is the task row component for the timesheet table.
 * It is responsible for rendering the task row of the timesheet table.
 *
 * @param {Array} props.dates - Array of date strings for the week.
 * @param {string} props.taskKey - Key of the task to be rendered.
 * @param {TaskProps} props.tasks - TaskProps object containing task data for the week.
 * @param {string} props.status - Status of the task.
 * @param {Array} props.likedTaskData - Array of liked task data to determine if the task is liked or not.
 * @param {function} props.onCellClick - Function to be called when a cell is clicked.
 * @param {boolean} props.disabled - Whether the task row is disabled.
 */
export const TaskRow = ({ dates, taskKey, tasks, status, likedTaskData, onCellClick, disabled, ...rest }: TaskRowProps) => {
  const [taskLiked, setTaskLiked] = useState(false);

  const taskData = useMemo(() => {
    let total = 0;
    const totalTimeEntries = [];
    for (const date of dates) {
      const currentTotal = calculateTotalHours(tasks, date);
      totalTimeEntries.push({
        time: currentTotal === 0 ? "" : floatToTime(currentTotal, 2),
        nonBillable: currentTotal === 0 || (taskKey && tasks[taskKey]?.is_billable) ? false : true,
        disabled: disabled || false,
      });
      total += currentTotal;
    }
    return { total, totalTimeEntries };
  }, [dates, taskKey, tasks, disabled]);

  const handleCellClick = useCallback(
    (_: number | undefined, dayIndex: number) => {
      if (!taskKey) return;
      const value: NewTimesheetProps = {
        date: dates[dayIndex],
        hours: 0,
        description: "",
        name: "",
        task: taskKey,
        project: tasks[taskKey].project,
		employee: "",
      };
      onCellClick?.(value);
    },
    [taskKey, dates, tasks, onCellClick],
  );

  useEffect(() => {
    setTaskLiked(likedTaskData.some((obj) => obj.name === taskKey) || false);
  }, [likedTaskData, taskKey]);

  return (
    <BaseTaskRow
      {...rest}
      status={status ? taskStatusMap[status] : "open"}
      totalHours={floatToTime(taskData.total, 2)}
      timeEntries={taskData.totalTimeEntries}
      starred={taskLiked}
      onCellClick={handleCellClick}
    />
  );
};
