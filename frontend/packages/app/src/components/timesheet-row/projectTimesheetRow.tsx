/**
 * External dependencies
 */
import { useMemo } from "react";
import {
  type ApprovalStatusLabelType,
  ErrorFallback,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import type { WorkingFrequency } from "@/types";
import type { HolidayProp, LeaveProps, TaskProps } from "@/types/timesheet";
import { MemberRow } from "./components/row/memberRow";
import { ProjectRow } from "./components/row/projectRow";
import { TaskRow } from "./components/row/taskRow";
import { WeekRow } from "./components/row/weekRow";
import { mergeProjectMemberTasks } from "./utils";

export type ProjectTimesheetMember = {
  label: string;
  employee: string;
  avatarUrl?: string;
  tasks: TaskProps;
  workingHour: number;
  workingFrequency: WorkingFrequency;
  leaves: LeaveProps[];
  holidays: HolidayProp[];
  status: ApprovalStatusLabelType;
};

export type ProjectTimesheetProject = {
  project: string;
  projectName: string | null;
  members: ProjectTimesheetMember[];
};

export type ProjectTimesheetRowProps = {
  label?: string;
  dates: string[];
  firstWeek: boolean;
  projects: ProjectTimesheetProject[];
};

export const ProjectTimesheetRow = ({
  label,
  dates,
  firstWeek,
  projects,
}: ProjectTimesheetRowProps) => {
  const projectsData = useMemo(() => {
    return projects.map((project) => ({
      ...project,
      mergedTasks: mergeProjectMemberTasks(project.members),
    }));
  }, [projects]);

  return (
    <ErrorFallback>
      <WeekRow
        label={label}
        dates={dates}
        workingFrequency="Per Day"
        className="pl-3"
        collapsed={!firstWeek}
        isReadOnlyWeek={true}
      >
        {() => (
          <>
            {projectsData.map((project) => (
              <ProjectRow
                key={project.project}
                dates={dates}
                tasks={project.mergedTasks}
                label={project.projectName || project.project}
                className="pl-7.5"
              >
                {project.members.map((member) => (
                  <MemberRow
                    key={member.employee}
                    label={member.label}
                    avatarUrl={member.avatarUrl}
                    dates={dates}
                    tasks={member.tasks}
                    leaves={member.leaves}
                    holidays={member.holidays}
                    workingHour={member.workingHour}
                    workingFrequency={member.workingFrequency}
                    status="None"
                    className="pl-13.5"
                    collapsed={true}
                  >
                    {({ totalTimeEntriesInHours, dailyWorkingHours }) => (
                      <>
                        {Object.entries(member.tasks).map(([taskKey, task]) => (
                          <TaskRow
                            key={taskKey}
                            dates={dates}
                            taskKey={taskKey}
                            tasks={{ [taskKey]: task }}
                            label={task.subject || task.name}
                            status={task.status}
                            className="pl-19.5"
                            disabled={
                              member.status === "Approved" ||
                              member.status === "Processing Timesheet"
                            }
                            dailyWorkingHours={dailyWorkingHours}
                            totalTimeEntriesInHours={totalTimeEntriesInHours}
                            employee={member.employee}
                            hideLikeButton={true}
                          />
                        ))}
                      </>
                    )}
                  </MemberRow>
                ))}
              </ProjectRow>
            ))}
          </>
        )}
      </WeekRow>
    </ErrorFallback>
  );
};
