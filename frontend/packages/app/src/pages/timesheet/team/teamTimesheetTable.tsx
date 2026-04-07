/**
 * External dependencies.
 */
import { Fragment, useCallback, useState } from "react";
import { Spinner, Typography } from "@next-pms/design-system/components";
import {
  Button,
  Filter,
  FilterCondition,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import { Ellipsis } from "lucide-react";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import TeamTaskLog from "@/components/task-log/teamTaskLog";
import { HeaderRow } from "@/components/timesheet-row/components/row/headerRow";
import { TeamTimesheetRow } from "@/components/timesheet-row/teamTimesheetRow";
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import { TimesheetFilters } from "@/types/timesheet";
import { useTeamTimesheet } from "./context";
import WeeklyApproval from "./weekly-approval";
import { sampleFields } from "../constants";

export const TeamTimesheetTable = () => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const hasMoreWeeks = useTeamTimesheet(({ state }) => state.hasMoreWeeks);
  const isLoadingTeamData = useTeamTimesheet(
    ({ state }) => state.isLoadingTeamData,
  );
  const weekGroups = useTeamTimesheet(({ state }) => state.weekGroups);
  const loadData = useTeamTimesheet(({ actions }) => actions.loadData);
  const isWeeklyApprovalOpen = useTeamTimesheet(
    ({ state }) => state.isWeeklyApprovalOpen,
  );
  const employee = useTeamTimesheet(({ state }) => state.employee);
  const startDate = useTeamTimesheet(({ state }) => state.startDate);
  const setIsWeeklyApprovalOpen = useTeamTimesheet(
    ({ actions }) => actions.setIsWeeklyApprovalOpen,
  );
  const [compositeFilters, setCompositeFilters] = useState<FilterCondition[]>(
    [],
  );
  const [filters, setFilters] = useState<TimesheetFilters>({
    search: "",
  });

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  return (
    <div className="w-full flex-1 min-h-0 py-3.5 px-3">
      <WeeklyApproval
        employee={employee}
        startDate={startDate}
        open={isWeeklyApprovalOpen}
        onOpenChange={setIsWeeklyApprovalOpen}
      />
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
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Filter
            fields={sampleFields}
            value={compositeFilters}
            onChange={(newFilters) => {
              setCompositeFilters(newFilters);
            }}
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
          hasMore={hasMoreWeeks}
          verticalLodMore={loadData}
          className="w-full h-[calc(100%-var(--spacing)*7)] overflow-auto scrollbar [scrollbar-gutter:stable]"
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
                </Fragment>
              );
            })}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
};
