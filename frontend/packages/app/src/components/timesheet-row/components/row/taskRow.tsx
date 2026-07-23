/**
 * External dependencies
 */
import { useCallback, useEffect, useMemo } from "react";
import { floatToTime } from "@next-pms/design-system";
import {
  TaskRow as BaseTaskRow,
  type TaskRowTimeEntry,
  taskStatusMap,
} from "@next-pms/design-system/components";
import { useToggleLike } from "@next-pms/hooks";
import { useToasts } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies
 */
import TaskPopover from "@/components/taskPopover";
import { calculateTotalHours, parseFrappeErrorMsg } from "@/lib/utils";
import { useGuardedAction } from "@/pages/allocations/unsavedChanges/useUnsavedChanges";
import { usePersonalTimesheet } from "@/pages/timesheet/personal/context";
import type { TaskDataItemProps } from "@/types/timesheet";
import type { TaskRowProps } from "./types";
import { InlineTimeEntry } from "../inline-time-entry";

/**
 * @description This is the task row component for the timesheet table.
 * It is responsible for rendering the task row of the timesheet table.
 *
 * @param {Array} props.dates - Array of date strings for the week.
 * @param {string} props.taskKey - Key of the task to be rendered.
 * @param {TaskProps} props.tasks - TaskProps object containing task data for the week.
 * @param {string} props.status - Status of the task.
 * @param {boolean} props.disabled - Whether the task row is disabled.
 * @param {number} props.dailyWorkingHours - Daily working hours for the task.
 * @param {string} props.employee - Employee for the timesheet entry.
 * @param {boolean} props.hideStarButton - Whether to hide the star button for liking the task.
 */
export const TaskRow = ({
  dates,
  taskKey,
  tasks,
  status,
  disabled,
  dailyWorkingHours,
  totalTimeEntriesInHours,
  employee,
  hideLikeButton,
  setSelectedTask,
  ...rest
}: TaskRowProps) => {
  const likedTaskData = usePersonalTimesheet(
    ({ state }) => state.likedTaskData,
  );
  const refetchLikedTasks = usePersonalTimesheet(
    ({ actions }) => actions.refetchLikedTasks,
  );
  const toast = useToasts();
  const requestGuarded = useGuardedAction();

  const {
    liked: taskLiked,
    error: likeError,
    toggle: toggleLike,
  } = useToggleLike({
    doctype: "Task",
    name: taskKey,
    liked: likedTaskData?.some((obj) => obj.name === taskKey) || false,
    onToggled: refetchLikedTasks,
  });

  const taskData = useMemo(() => {
    let total = 0;
    const totalTimeEntries: TaskRowTimeEntry[] = [];
    const tasksForDates: TaskDataItemProps[][] = [];
    for (const date of dates) {
      const currentTotal = calculateTotalHours(tasks, date);
      // Check if the time entry for the day is approved or not.
      const tasksForDate = tasks[taskKey].data.filter((entry) =>
        entry.from_time.includes(date),
      );
      const isApproved = tasksForDate.some((entry) => entry.docstatus === 1);
      totalTimeEntries.push({
        time: currentTotal === 0 ? "" : floatToTime(currentTotal, 2),
        nonBillable:
          currentTotal === 0 || (taskKey && tasks[taskKey]?.is_billable)
            ? false
            : true,
        disabled: disabled || isApproved || false,
      });
      tasksForDates.push(tasksForDate);
      total += currentTotal;
    }
    return { total, totalTimeEntries, tasksForDates };
  }, [dates, taskKey, tasks, disabled]);

  const renderTaskHoverContent = useCallback(
    (taskKey: string) => {
      const task = tasks[taskKey];

      return (
        <TaskPopover
          label={rest.label}
          projectName={task?.project_name || ""}
          dueDate={task?.due_date}
          actualHours={task?.actual_time || 0}
          estimatedHours={task?.expected_time || 0}
          status={taskStatusMap[status] ?? "open"}
        />
      );
    },
    [rest.label, tasks, status],
  );

  const handleStar = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    toggleLike();
  };

  const onLabelClick = useCallback(
    (taskKey: string) => {
      if (!setSelectedTask) {
        return;
      }
      setSelectedTask(taskKey);
    },
    [setSelectedTask],
  );

  useEffect(() => {
    if (likeError) {
      toast.error(
        parseFrappeErrorMsg(
          likeError as Parameters<typeof parseFrappeErrorMsg>[0],
        ),
      );
    }
  }, [likeError]);

  return (
    <BaseTaskRow
      {...rest}
      status={taskStatusMap[status] ?? "open"}
      totalHours={floatToTime(taskData.total, 2)}
      timeEntries={taskData.totalTimeEntries}
      starred={taskLiked}
      renderTaskHoverContent={renderTaskHoverContent}
      taskKey={taskKey}
      onLabelClick={onLabelClick}
      onStarClick={handleStar}
      hideStarButton={hideLikeButton}
      requestGuarded={requestGuarded}
      renderInlineTimeEntryPopover={(
        _,
        dayIndex,
        closePopover,
        reportEngaged,
      ) => (
        <InlineTimeEntry
          key={`${taskKey}-${dates[dayIndex]}`}
          tasks={taskData.tasksForDates[dayIndex]}
          dailyWorkingHours={dailyWorkingHours}
          totalUsedHoursInDay={totalTimeEntriesInHours?.[dayIndex]}
          timeEntry={taskData.totalTimeEntries[dayIndex]}
          disabled={taskData.totalTimeEntries[dayIndex].disabled}
          date={dates[dayIndex]}
          taskKey={taskKey}
          employee={employee ?? ""}
          onSubmitSuccess={closePopover}
          onEngagedChange={reportEngaged}
        />
      )}
    />
  );
};
