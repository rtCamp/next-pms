/**
 * External dependencies
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorFallback } from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { LIKED_TASK_KEY } from "@/lib/constant";
import {
  hasKeyInLocalStorage,
  getLocalStorage,
  removeFromLikedTask,
  setLikedTask,
} from "@/lib/storage";
import { getHolidayList } from "@/lib/utils";
import { TaskDataProps } from "@/types/timesheet";
import { ProjectRow } from "./components/row/projectRow";
import { TaskRow } from "./components/row/taskRow";
import { TimeOffRow } from "./components/row/timeOffRow";
import { TotalRow } from "./components/row/totalRow";
import { WeekRow } from "./components/row/weekRow";
import type { timesheetTableProps } from "./components/types";

export const TimesheetTable = ({
  label,
  employee,
  dates,
  holidays,
  tasks,
  leaves,
  firstWeek,
  workingHour,
  workingFrequency,
  disabled,
  weeklyStatus,
  importTasks = false,
  loadingLikedTasks,
  likedTaskData,
  getLikedTaskData,
  hideLikeButton,
  onButtonClick,
  status,
}: timesheetTableProps) => {
  const holidayList = getHolidayList(holidays);
  const task_date_range_key = dates[0] + "-" + dates[dates.length - 1];

  const deleteTaskFromLocalStorage = useCallback(() => {
    removeFromLikedTask(LIKED_TASK_KEY, task_date_range_key);
  }, [task_date_range_key]);

  useEffect(() => {
    if (weeklyStatus === "Approved") {
      deleteTaskFromLocalStorage();
    }
  }, [deleteTaskFromLocalStorage, weeklyStatus]);

  const projects = useMemo(() => {
    const projectMap = new Map<
      string,
      { project_name: string | null; project: string; tasks: typeof tasks }
    >();

    Object.entries(tasks).forEach(([taskKey, taskData]) => {
      const { project, project_name } = taskData;
      if (!projectMap.has(project)) {
        projectMap.set(project, { project_name, project, tasks: {} });
      }
      projectMap.get(project)!.tasks[taskKey] = taskData;
    });

    return Array.from(projectMap.values());
  }, [tasks]);

  return (
    <ErrorFallback>
      <WeekRow
        label={label}
        dates={dates}
        tasks={tasks}
        leaves={leaves}
        holidays={holidays}
        workingHour={workingHour}
        workingFrequency={workingFrequency}
        status={status}
        className="pl-3"
        onButtonClick={onButtonClick}
        collapsed={!firstWeek}
      >
        {({
          totalHours,
          totalTimeEntries,
          totalTimeEntriesInHours,
          dailyWorkingHours,
          status,
        }) => (
          <>
            <TotalRow
              breadcrumbs={{
                items: [{ label: "Projects" }, { label: "Tasks" }],
                size: "md",
                highlightAllItems: true,
                crumbClassName: "first:pl-0 last:pr-0",
              }}
              totalHours={totalHours}
              totalTimeEntries={totalTimeEntries}
              status={status}
              className="pl-7.5"
              starred={true}
            />

            {projects.map((project) => (
              <ProjectRow
                key={project.project}
                dates={dates}
                tasks={project.tasks}
                label={project.project_name || project.project}
                status={status}
                className="pl-7.5"
              >
                {Object.entries(project.tasks).map(([taskKey, task]) => (
                  <TaskRow
                    key={taskKey}
                    dates={dates}
                    taskKey={taskKey}
                    tasks={{ [taskKey]: task }}
                    label={task.subject || task.name}
                    status={task.status}
                    likedTaskData={likedTaskData as TaskDataProps[]}
                    className="pl-13.5"
                    disabled={disabled}
                    dailyWorkingHours={dailyWorkingHours}
                    totalTimeEntriesInHours={totalTimeEntriesInHours}
                    employee={employee}
                  />
                ))}
              </ProjectRow>
            ))}

            <TimeOffRow
              label="Time-off"
              className="pl-7.5"
              dates={dates}
              leaves={leaves}
              holidayList={holidayList}
              expectedHours={dailyWorkingHours}
            />
          </>
        )}
      </WeekRow>
    </ErrorFallback>
  );
};
