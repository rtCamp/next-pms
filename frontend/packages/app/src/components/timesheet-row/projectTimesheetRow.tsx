/**
 * External dependencies
 */
import { useMemo } from "react";
import {
  type ApprovalStatusLabelType,
  ErrorFallback,
  Typography,
} from "@next-pms/design-system/components";
import { Skeleton } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies
 */
import { useTimesheetOutletContext } from "@/pages/timesheet/outletContext";
import type { WorkingFrequency } from "@/types";
import type { HolidayProp, LeaveProps, TaskProps } from "@/types/timesheet";
import { MemberRow } from "./components/row/memberRow";
import { ProjectRow } from "./components/row/projectRow";
import { TaskRow } from "./components/row/taskRow";
import { TimeOffRow } from "./components/row/timeOffRow";
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
  backdateRestrictedBefore: string | null;
};

export type ProjectTimesheetProject = {
  project: string;
  projectName: string | null;
  members: ProjectTimesheetMember[];
};

export type ProjectTimesheetRowProps = {
  label?: string;
  dates: string[];
  collapsed: boolean;
  projects: ProjectTimesheetProject[];
  hasMoreProjects?: boolean;
  isLoadingProjects?: boolean;
  loadMoreRef?: (element: HTMLElement | null) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export const ProjectTimesheetRow = ({
  label,
  dates,
  collapsed,
  projects,
  hasMoreProjects,
  isLoadingProjects,
  loadMoreRef,
  onCollapsedChange,
}: ProjectTimesheetRowProps) => {
  const { openAddTimeDialog } = useTimesheetOutletContext();
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
        triggerClassName="sticky top-7 z-10 bg-surface-white"
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
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
                highlightTimeEntries={true}
                lockApproved={false}
                className="pl-7.5"
                onCellClick={(date) =>
                  openAddTimeDialog({
                    date,
                    project: project.project,
                    projectLabel: project.projectName || project.project,
                  })
                }
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
                    disabled={member.status === "Approved"}
                    backdateRestrictedBefore={member.backdateRestrictedBefore}
                    onCellClick={(date) =>
                      openAddTimeDialog({
                        date,
                        employeeId: member.employee,
                        employeeLabel: member.label,
                        project: project.project,
                        projectLabel: project.projectName || project.project,
                      })
                    }
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
                            backdateRestrictedBefore={
                              member.backdateRestrictedBefore
                            }
                            hideLikeButton={true}
                          />
                        ))}
                        <TimeOffRow
                          label="Time-off"
                          className="pl-19.5"
                          dates={dates}
                          leaves={member.leaves}
                          holidays={member.holidays}
                          expectedHours={dailyWorkingHours}
                        />
                      </>
                    )}
                  </MemberRow>
                ))}
              </ProjectRow>
            ))}

            {isLoadingProjects || hasMoreProjects ? (
              <div ref={loadMoreRef}>
                <Skeleton className="h-11.25 w-full shrink-0 rounded-none" />
              </div>
            ) : projects.length === 0 ? (
              <div className="flex h-11.25 justify-center items-center border-b border-outline-gray-1 animate-fade-in">
                <Typography
                  variant="p"
                  className="text-base text-center text-ink-gray-5"
                >
                  No timesheet for this week
                </Typography>
              </div>
            ) : null}
          </>
        )}
      </WeekRow>
    </ErrorFallback>
  );
};
