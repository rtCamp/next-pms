/**
 * External dependencies
 */
import { useMemo } from "react";
import { floatToTime } from "@next-pms/design-system";
import { TaskRow as BaseTaskRow, taskStatusMap } from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { calculateTotalHours } from "@/lib/utils";
import type { TaskRowProps } from "./types";

/**
 * @description This is the task row component for the timesheet table.
 * It is responsible for rendering the task row of the timesheet table.
 *
 * @param {Array} props.dates - Array of date strings for the week.
 * @param {string} props.taskKey - Key of the task to be rendered.
 * @param {TaskProps} props.tasks - TaskProps object containing task data for the week.
 * @param {string} props.status - Status of the task.
 */
export const TaskRow = ({ dates, taskKey, tasks, status, ...rest }: TaskRowProps) => {
  const totalHours = useMemo(() => {
    let total = 0;
    const totalTimeEntries = [];
    for (const date of dates) {
      const currentTotal = calculateTotalHours(tasks, date);
      totalTimeEntries.push({
        time: currentTotal === 0 ? "" : floatToTime(currentTotal, 2),
        nonBillable: currentTotal === 0 || (taskKey && tasks[taskKey]?.is_billable) ? false : true,
        disabled: false,
      });
      total += currentTotal;
    }
    return { total, totalTimeEntries };
  }, [dates, taskKey, tasks]);

  return (
    <BaseTaskRow
      {...rest}
      status={status ? taskStatusMap[status] : "open"}
      totalHours={floatToTime(totalHours.total, 2)}
      timeEntries={totalHours.totalTimeEntries}
    />
  );
};
