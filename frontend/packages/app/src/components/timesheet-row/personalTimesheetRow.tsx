/**
 * External dependencies
 */
import { useCallback, useMemo } from "react";
import {
  ApprovalStatusLabelType,
  ErrorFallback,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { useImportedTasks } from "@/hooks/useImportedTasks";
import { getHolidayList } from "@/lib/utils";
import { useTimesheetOutletContext } from "@/pages/timesheet/outletContext";
import { usePersonalTimesheet } from "@/pages/timesheet/personal/context";
import { WorkingFrequency } from "@/types";
import type { HolidayProp, LeaveProps, TaskProps } from "@/types/timesheet";
import { ProjectRow } from "./components/row/projectRow";
import { TaskRow } from "./components/row/taskRow";
import { TimeOffRow } from "./components/row/timeOffRow";
import { TotalRow } from "./components/row/totalRow";
import { WeekRow } from "./components/row/weekRow";
import { groupTasksByProject, mergeImportedTasks } from "./utils";

export type PersonalTimesheetRowProps = {
  label?: string;
  employee?: string;
  dates: string[];
  holidays: Array<HolidayProp>;
  tasks: TaskProps;
  leaves: Array<LeaveProps>;
  firstWeek: boolean;
  workingHour: number;
  disabled?: boolean;
  workingFrequency: WorkingFrequency;
  importTasks?: boolean;
  hideLikeButton?: boolean;
  setSelectedTask?: (task: string) => void;
  onButtonClick?: () => void;
  status: ApprovalStatusLabelType;
  hideTotalRow: boolean;
};

export const PersonalTimesheetRow = ({
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
  onButtonClick,
  status,
  hideTotalRow,
  setSelectedTask,
  hideLikeButton,
}: PersonalTimesheetRowProps) => {
  const { openAddTimeDialog } = useTimesheetOutletContext();
  const holidayList = getHolidayList(holidays);

  // Get liked tasks from context
  const likedTaskData = usePersonalTimesheet(
    ({ state }) => state.likedTaskData,
  );

  // Week start date is the first date in the dates array
  const weekStartDate = dates[0] ?? "";

  // Hook to manage imported tasks in localStorage
  const {
    importedTasks,
    isWeekImported,
    importLikedTasks,
    clearImportedTasks,
  } = useImportedTasks(weekStartDate);

  // Merge imported tasks with existing tasks
  const mergedTasks = useMemo(
    () => mergeImportedTasks(tasks, importedTasks),
    [tasks, importedTasks],
  );

  const projects = useMemo(
    () => groupTasksByProject(mergedTasks),
    [mergedTasks],
  );

  // Handle star click - toggle import/clear of liked tasks
  const handleStarClick = useCallback(() => {
    if (isWeekImported) {
      clearImportedTasks();
    } else {
      // Import all liked tasks (full objects)
      importLikedTasks(likedTaskData ?? []);
    }
  }, [isWeekImported, clearImportedTasks, importLikedTasks, likedTaskData]);

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
          totalHoursTheme,
        }) => (
          <>
            {!hideTotalRow ? (
              <TotalRow
                breadcrumbs={{
                  items: [
                    { label: "Projects", interactive: false },
                    { label: "Tasks", interactive: false },
                  ],
                  size: "md",
                  highlightAllItems: true,
                  crumbClassName: "first:pl-0 last:pr-0",
                }}
                totalHours={totalHours}
                totalHoursTheme={totalHoursTheme}
                totalTimeEntries={totalTimeEntries}
                className="pl-7.5"
                starred={isWeekImported}
                disabled={disabled}
                onCellClick={openAddTimeDialog}
                onStarClick={handleStarClick}
              />
            ) : null}

            {projects.map((project) => (
              <ProjectRow
                key={project.project}
                dates={dates}
                tasks={project.tasks}
                label={project.project_name || project.project}
                hideTime={hideTotalRow}
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
                    className="pl-13.5"
                    disabled={disabled}
                    dailyWorkingHours={dailyWorkingHours}
                    totalTimeEntriesInHours={totalTimeEntriesInHours}
                    employee={employee}
                    setSelectedTask={setSelectedTask}
                    hideLikeButton={hideLikeButton}
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
