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
import { getHolidayList } from "@/lib/utils";
import { useTeamTimesheet } from "@/pages/timesheet/team/context";
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
};

type TeamTimesheetRowProps = {
  label?: string;
  dates: string[];
  firstWeek: boolean;
  teamMembers: TeamMember[];
  approvalPendingCount?: number;
  setSelectedTask?: (task: string) => void;
};

export const TeamTimesheetRow = ({
  label,
  dates,
  firstWeek,
  teamMembers,
  approvalPendingCount,
  setSelectedTask,
}: TeamTimesheetRowProps) => {
  const openWeeklyApproval = useTeamTimesheet(
    ({ actions }) => actions.openWeeklyApproval,
  );
  const teamMembersData = useMemo(() => {
    return teamMembers.map((member) => {
      const projects = groupTasksByProject(member.tasks);
      const holidayList = getHolidayList(member.holidays);

      return {
        ...member,
        projects,
        holidayList,
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
        collapsed={!firstWeek}
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
                className="pl-7.5"
                collapsed={true}
                onButtonClick={() =>
                  openWeeklyApproval(member.employee, dates[0])
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
                      holidayList={member.holidayList}
                      expectedHours={dailyWorkingHours}
                    />
                  </>
                )}
              </MemberRow>
            ))}
          </>
        )}
      </WeekRow>
    </ErrorFallback>
  );
};
