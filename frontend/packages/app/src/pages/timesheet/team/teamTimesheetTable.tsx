/**
 * External dependencies.
 */
import { Fragment, useState } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { Spinner, Typography } from "@next-pms/design-system/components";
import { Button, Filter, TextInput } from "@rtcamp/frappe-ui-react";
import { Ellipsis } from "lucide-react";

/**
 * Internal dependencies.
 */
import ApprovalStatusFilter from "@/components/filters/approvalStatusFilter";
import ReportsToFilter from "@/components/filters/reportsToFilter";
import { InfiniteScroll } from "@/components/infiniteScroll";
import TeamTaskLog from "@/components/task-log/teamTaskLog";
import { HeaderRow } from "@/components/timesheet-row/components/row/headerRow";
import { TeamTimesheetRow } from "@/components/timesheet-row/teamTimesheetRow";
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import { useTeamTimesheet } from "./context";
import WeeklyApproval from "./weekly-approval";
import { sampleFields } from "../constants";

export const TeamTimesheetTable = () => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [weeklyApproval, setWeeklyApproval] = useState<{
    employee: string;
    startDate: string;
  } | null>(null);

  const hasMore = useTeamTimesheet(({ state }) => state.hasMore);
  const isLoadingTeamData = useTeamTimesheet(
    ({ state }) => state.isLoadingTeamData,
  );
  const isFilterRequest = useTeamTimesheet(
    ({ state }) => state.isFilterRequest,
  );
  const weekGroups = useTeamTimesheet(({ state }) => state.weekGroups);
  const loadMore = useTeamTimesheet(({ actions }) => actions.loadMore);
  const filters = useTeamTimesheet(({ state }) => state.filters);
  const searchInput = useTeamTimesheet(({ state }) => state.searchInput);
  const compositeFilters = useTeamTimesheet(
    ({ state }) => state.compositeFilters,
  );
  const handleSearchChange = useTeamTimesheet(
    ({ actions }) => actions.handleSearchChange,
  );
  const handleApprovalStatusChange = useTeamTimesheet(
    ({ actions }) => actions.handleApprovalStatusChange,
  );
  const handleReportsToChange = useTeamTimesheet(
    ({ actions }) => actions.handleReportsToChange,
  );
  const handleCompositeFilterChange = useTeamTimesheet(
    ({ actions }) => actions.handleCompositeFilterChange,
  );

  const isFilteredDataLoading = isFilterRequest && isLoadingTeamData;

  return (
    <div className="w-full flex-1 min-h-0 py-3.5 px-3 relative">
      {weeklyApproval && (
        <WeeklyApproval
          employee={weeklyApproval.employee}
          startDate={weeklyApproval.startDate}
          open={!!weeklyApproval}
          onOpenChange={(open) => {
            if (!open) setWeeklyApproval(null);
          }}
        />
      )}
      {selectedTask && (
        <TeamTaskLog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setSelectedTask(null);
            }
          }}
        />
      )}
      <div className="flex flex-wrap gap-2 justify-between mb-3.5">
        <div className="flex gap-2">
          <TextInput
            placeholder="Search Tasks"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <ReportsToFilter
            value={filters.reportsTo}
            onChange={handleReportsToChange}
          />
          <ApprovalStatusFilter
            value={filters.approvalStatus}
            onChange={handleApprovalStatusChange}
            excludeOptions={["not-submitted"]}
          />
        </div>
        <div className="flex gap-2">
          <Filter
            fields={sampleFields}
            value={compositeFilters}
            onChange={handleCompositeFilterChange}
          />
          <Button icon={() => <Ellipsis size={16} />} />
        </div>
      </div>

      {isLoadingTeamData && weekGroups.length === 0 ? (
        <Spinner isFull />
      ) : weekGroups.length === 0 ? (
        <Typography className="flex justify-center items-center">
          No Data
        </Typography>
      ) : (
        <InfiniteScroll
          isLoading={isLoadingTeamData}
          hasMore={hasMore}
          verticalLodMore={loadMore}
          className={cn(
            "w-full h-[calc(100%-var(--spacing)*7)] overflow-auto scrollbar [scrollbar-gutter:stable] opacity-100",
            {
              "opacity-50 transition-opacity duration-150":
                isFilteredDataLoading,
            },
          )}
          count={NUMBER_OF_WEEKS_TO_FETCH}
        >
          <div className="min-w-225">
            {weekGroups.map((week, index) => {
              return (
                <Fragment key={`${week.start_date}-${week.end_date}`}>
                  {index === 0 ? (
                    <div className="sticky top-0 z-10 mb-4 bg-surface-white">
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

                  <div className="animate-fade-in">
                    <TeamTimesheetRow
                      label={week.key}
                      dates={week.dates}
                      firstWeek={index === 0}
                      approvalPendingCount={week.approvalPendingCount}
                      setSelectedTask={setSelectedTask}
                      openWeeklyApproval={(employee, date) =>
                        setWeeklyApproval({ employee, startDate: date })
                      }
                      teamMembers={week.members.map((member) => ({
                        label: member.employee.employee_name,
                        employee: member.employee.name,
                        avatarUrl: member.employee.image ?? undefined,
                        tasks: member.week.tasks,
                        leaves: member.leaves,
                        holidays: member.holidays,
                        workingHour: member.working_hour,
                        workingFrequency: member.working_frequency,
                        status: member.week.status,
                      }))}
                    />
                  </div>
                </Fragment>
              );
            })}
          </div>
        </InfiniteScroll>
      )}

      {isFilteredDataLoading ? (
        <Spinner
          isFull
          className="absolute top-0 left-0 w-full h-full cursor-wait"
        />
      ) : null}
    </div>
  );
};
