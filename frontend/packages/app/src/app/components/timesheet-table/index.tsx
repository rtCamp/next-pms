/**
 * External dependencies
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { TimeOffRow } from "@next-pms/design-system/components";
import { ErrorFallback } from "@next-pms/design-system/components";
/**
 * Internal dependencies
 */
import { LIKED_TASK_KEY } from "@/lib/constant";
import { hasKeyInLocalStorage, getLocalStorage, removeFromLikedTask, setLikedTask } from "@/lib/storage";
import { getHolidayList } from "@/lib/utils";
import { HeaderRow } from "./components/row/headerRow";
import { ProjectRow } from "./components/row/projectRow";
import { TaskRow } from "./components/row/taskRow";
import { TotalRow } from "./components/row/totalRow";
import { WeekRow } from "./components/row/weekRow";
import type { timesheetTableProps } from "./components/types";

const MOCK_TIMEOFF_ENTRIES = ["", "", "", "", "", "08:00", ""];
const MOCK_TIMEOFF_TOTAL = "08:00";

export const TimesheetTable = ({
  label,
  dates,
  holidays,
  tasks,
  leaves,
  onCellClick,
  showHeading = true,
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
  const [isTaskLogDialogBoxOpen, setIsTaskLogDialogBoxOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const task_date_range_key = dates[0] + "-" + dates[dates.length - 1];
  const has_liked_task = hasKeyInLocalStorage(LIKED_TASK_KEY);

  const setTaskInLocalStorage = () => {
    setLikedTask(LIKED_TASK_KEY, task_date_range_key, likedTaskData!);
    setFilteredLikedTasks(
      likedTaskData?.filter((likedTask: { name: string }) => !Object.keys(tasks).includes(likedTask.name)),
    );
  };

  const liked_tasks = has_liked_task ? (getLocalStorage(LIKED_TASK_KEY)[task_date_range_key] ?? []) : [];

  const [filteredLikedTasks, setFilteredLikedTasks] = useState(
    liked_tasks.filter((likedTask: { name: string }) => !Object.keys(tasks).includes(likedTask.name)),
  );
  useEffect(() => {
    const filteredLikedTasks = liked_tasks.filter(
      (likedTask: { name: string }) => !Object.keys(tasks).includes(likedTask.name),
    );
    setFilteredLikedTasks(filteredLikedTasks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const deleteTaskFromLocalStorage = useCallback(() => {
    removeFromLikedTask(LIKED_TASK_KEY, task_date_range_key);
  }, [task_date_range_key]);

  useEffect(() => {
    if (weeklyStatus === "Approved") {
      deleteTaskFromLocalStorage();
    }
  }, [deleteTaskFromLocalStorage, weeklyStatus]);

  const projects = useMemo(() => {
    const projectMap = new Map<string, { project_name: string | null; project: string; tasks: typeof tasks }>();

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
      {showHeading && (
        <div className="mb-4">
          <HeaderRow
            dates={dates}
            showHeading={showHeading}
            breadcrumbs={{
              items: [
                { label: "Week", interactive: false },
                { label: "Project", interactive: false },
                { label: "Task", interactive: false },
              ],
              highlightLastItem: false,
              size: "sm",
              crumbClassName: "first:pl-0 last:pr-0",
              className: "pl-[8px]",
            }}
          />
        </div>
      )}
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
      >
        {({ totalHours, totalTimeEntries, status }) => (
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
              className="pl-[30px]"
              starred={true}
            />

            {projects.map((project) => (
              <ProjectRow
                key={project.project}
                dates={dates}
                tasks={project.tasks}
                label={project.project_name || project.project}
                status={status}
                className="pl-[30px]"
              >
                {Object.entries(project.tasks).map(([taskKey, task]) => (
                  <TaskRow
                    key={taskKey}
                    dates={dates}
                    taskKey={taskKey}
                    tasks={{ [taskKey]: task }}
                    label={task.subject || task.name}
                    status={task.status}
                    starred={task.starred ? true : false}
                    onCellClick={() => {}}
                    className="pl-[54px]"
                  />
                ))}
              </ProjectRow>
            ))}

            <TimeOffRow
              label="Time-off"
              timeOffEntries={MOCK_TIMEOFF_ENTRIES}
              totalHours={MOCK_TIMEOFF_TOTAL}
              className="pl-[30px]"
            />
          </>
        )}
      </WeekRow>
    </ErrorFallback>
  );
};
