/**
 * External dependencies
 */
import { useMemo } from "react";
import {
  ApprovalStatusLabelType,
  ErrorFallback,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { getHolidayList } from "@/lib/utils";
import { useTimesheetOutletContext } from "@/pages/timesheet/outletContext";
import { WorkingFrequency } from "@/types";
import type {
  HolidayProp,
  LeaveProps,
  TaskDataProps,
  TaskProps,
} from "@/types/timesheet";
import { ProjectRow } from "./components/row/projectRow";
import { TaskRow } from "./components/row/taskRow";
import { TimeOffRow } from "./components/row/timeOffRow";
import { TotalRow } from "./components/row/totalRow";
import { WeekRow } from "./components/row/weekRow";
import { groupTasksByProject } from "./utils";

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
  likedTaskData?: Array<TaskDataProps>;
  hideLikeButton?: boolean;
  setSelectedTask?: (task: string) => void;
  onButtonClick?: () => void;
  status: ApprovalStatusLabelType;
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
  likedTaskData,
  onButtonClick,
  status,
  setSelectedTask,
  hideLikeButton,
}: PersonalTimesheetRowProps) => {
  const { openAddTimeDialog } = useTimesheetOutletContext();
  const holidayList = getHolidayList(holidays);
  const projects = useMemo(() => groupTasksByProject(tasks), [tasks]);

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
              starred={true}
              disabled={disabled}
              onCellClick={openAddTimeDialog}
            />

            {projects.map((project) => (
              <ProjectRow
                key={project.project}
                dates={dates}
                tasks={project.tasks}
                label={project.project_name || project.project}
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
                    likedTaskData={likedTaskData}
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
