/**
 * External dependencies.
 */
import type { ChangeEvent } from "react";
import { Spinner, Typography } from "@next-pms/design-system/components";
import { TextInput } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useTeamTimesheet } from "./context";
import WeeklyApproval from "./weekly-approval";
import { InfiniteScroll } from "../../../components/infiniteScroll";
import { HeaderRow } from "../../../components/timesheet-row/components/row/headerRow";
import { TeamTimesheetRow } from "../../../components/timesheet-row/teamTimesheetRow";
import { NUMBER_OF_WEEKS_TO_FETCH } from "../constants";

export const TeamTimesheetTable = () => {
  const search = useTeamTimesheet(({ state }) => state.search);
  const hasMoreWeeks = useTeamTimesheet(({ state }) => state.hasMoreWeeks);
  const isLoadingTeamData = useTeamTimesheet(
    ({ state }) => state.isLoadingTeamData,
  );
  const weekGroups = useTeamTimesheet(({ state }) => state.weekGroups);
  const setSearch = useTeamTimesheet(({ actions }) => actions.setSearch);
  const loadData = useTeamTimesheet(({ actions }) => actions.loadData);
  const isWeeklyApprovalOpen = useTeamTimesheet(
    ({ state }) => state.isWeeklyApprovalOpen,
  );
  const employee = useTeamTimesheet(({ state }) => state.employee);
  const startDate = useTeamTimesheet(({ state }) => state.startDate);
  const setIsWeeklyApprovalOpen = useTeamTimesheet(
    ({ actions }) => actions.setIsWeeklyApprovalOpen,
  );

  const hasData = weekGroups.length > 0;

  return (
    <div className="w-full h-full py-3.5 px-3">
      <WeeklyApproval
        employee={employee}
        startDate={startDate}
        open={isWeeklyApprovalOpen}
        onOpenChange={setIsWeeklyApprovalOpen}
      />
      <div className="flex justify-between mb-3.5">
        <TextInput
          placeholder="Search Member or Task"
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
        />
      </div>

      {isLoadingTeamData && !hasData ? (
        <Spinner isFull />
      ) : !hasData ? (
        <Typography className="flex items-center justify-center">
          No Data
        </Typography>
      ) : (
        <InfiniteScroll
          isLoading={isLoadingTeamData}
          hasMore={hasMoreWeeks}
          verticalLodMore={loadData}
          className="w-full h-full overflow-auto scrollbar [scrollbar-gutter:stable]"
          count={NUMBER_OF_WEEKS_TO_FETCH}
        >
          <div className="min-w-225">
            {weekGroups.map((week, index) => {
              return (
                <div
                  key={`${week.start_date}-${week.end_date}`}
                  className="animate-fade-in"
                >
                  {index === 0 ? (
                    <div className="mb-4 sticky top-0 bg-surface-white z-10">
                      <HeaderRow
                        dates={week.dates}
                        showHeading={true}
                        breadcrumbs={{
                          items: [
                            { label: "Week", interactive: false },
                            { label: "Member", interactive: false },
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
                  ) : null}

                  <TeamTimesheetRow
                    label={week.key}
                    dates={week.dates}
                    firstWeek={index === 0}
                    disabled={true}
                    teamMembers={week.members.map((member) => ({
                      label: member.employee.employee_name,
                      employee: member.employee.name,
                      avatarUrl: member.employee.image,
                      tasks: member.week.tasks,
                      leaves: member.leaves,
                      holidays: member.holidays,
                      workingHour: member.working_hour,
                      workingFrequency: member.working_frequency,
                      status: member.week.status,
                    }))}
                  />
                </div>
              );
            })}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
};
