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
import { groupTasksByProject } from "./utils";

export type TeamMember = {
  label: string;
  employee: string;
  avatarUrl?: string;
  tasks: TaskProps;
  leaves: Array<LeaveProps>;
  holidays: Array<HolidayProp>;
  workingHour: number;
  workingFrequency: WorkingFrequency;
  status: ApprovalStatusLabelType;
  backdateRestrictedBefore: string | null;
};

type TeamTimesheetRowProps = {
  label?: string;
  dates: string[];
  collapsed: boolean;
  teamMembers: TeamMember[];
  approvalPendingCount?: number;
  hasMoreMembers?: boolean;
  isLoadingMembers?: boolean;
  loadMoreRef?: (element: HTMLElement | null) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  setSelectedTask?: (task: string) => void;
  openWeeklyApproval?: (employee: string, date: string) => void;
};

export const TeamTimesheetRow = ({
  label,
  dates,
  collapsed,
  teamMembers,
  approvalPendingCount,
  hasMoreMembers,
  isLoadingMembers,
  loadMoreRef,
  onCollapsedChange,
  setSelectedTask,
  openWeeklyApproval,
}: TeamTimesheetRowProps) => {
  const { openAddTimeDialog } = useTimesheetOutletContext();
  const teamMembersData = useMemo(() => {
    return teamMembers.map((member) => {
      const projects = groupTasksByProject(member.tasks);

      return {
        ...member,
        projects,
      };
    });
  }, [teamMembers]);

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
        approvalPendingCount={approvalPendingCount}
      >
        {() => (
          <>
            {teamMembersData.map((member) => (
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
                status={member.status}
                hideAction={member.status === "Not Submitted"}
                className="pl-7.5 animate-fade-in"
                collapsed={true}
                disabled={member.status === "Approved"}
                backdateRestrictedBefore={member.backdateRestrictedBefore}
                onCellClick={(date) =>
                  openAddTimeDialog({
                    date,
                    employeeId: member.employee,
                    employeeLabel: member.label,
                  })
                }
                onButtonClick={() =>
                  openWeeklyApproval?.(member.employee, dates[0])
                }
              >
                {({ totalTimeEntriesInHours, dailyWorkingHours }) => (
                  <>
                    {member.projects.map((project) => (
                      <ProjectRow
                        key={project.project}
                        dates={dates}
                        tasks={project.tasks}
                        label={project.project_name || project.project}
                        className="pl-13.5"
                        disabled={member.status === "Approved"}
                        backdateRestrictedBefore={
                          member.backdateRestrictedBefore
                        }
                        onCellClick={(date) =>
                          openAddTimeDialog({
                            date,
                            project: project.project,
                            projectLabel:
                              project.project_name || project.project,
                            employeeId: member.employee,
                            employeeLabel: member.label,
                          })
                        }
                      >
                        {Object.entries(project.tasks).map(
                          ([taskKey, task]) => (
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
                              setSelectedTask={setSelectedTask}
                            />
                          ),
                        )}
                      </ProjectRow>
                    ))}

                    <TimeOffRow
                      label="Time-off"
                      className="pl-13.5"
                      dates={dates}
                      leaves={member.leaves}
                      holidays={member.holidays}
                      expectedHours={dailyWorkingHours}
                    />
                  </>
                )}
              </MemberRow>
            ))}

            {isLoadingMembers || hasMoreMembers ? (
              <div ref={loadMoreRef}>
                <Skeleton className="h-11.25 w-full shrink-0 rounded-none" />
              </div>
            ) : teamMembers.length === 0 ? (
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
