/**
 * External dependencies.
 */
import { Fragment, useState } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import {
  LoadingOverlay,
  Spinner,
  Typography,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import TeamTaskLog from "@/components/task-log/teamTaskLog";
import { HeaderRow } from "@/components/timesheet-row/components/row/headerRow";
import { useDefaultExpandedWeeks } from "@/hooks/useDefaultExpandedWeeks";
import { useTeamTimesheet } from "./context";
import { SubHeader } from "./subHeader";
import { TeamTimesheetWeek } from "./teamTimesheetWeek";
import WeeklyApproval from "./weekly-approval";

const TeamTimesheetGrid = () => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [weeklyApproval, setWeeklyApproval] = useState<{
    employee: string;
    startDate: string;
  } | null>(null);
  const { defaultExpandedWeeks, isLoading: isLoadingSettings } =
    useDefaultExpandedWeeks();

  const weeks = useTeamTimesheet(({ state }) => state.weeks);
  const hasMoreWeeks = useTeamTimesheet(({ state }) => state.hasMoreWeeks);
  const isLoadingWeeks = useTeamTimesheet(({ state }) => state.isLoadingWeeks);
  const isNextPageLoading = useTeamTimesheet(
    ({ state }) => state.isNextPageLoading,
  );
  const isFilterRequest = useTeamTimesheet(
    ({ state }) => state.isFilterRequest,
  );
  const activeFilterKey = useTeamTimesheet(
    ({ state }) => state.activeFilterKey,
  );
  const resolvedFilterKey = useTeamTimesheet(
    ({ state }) => state.resolvedFilterKey,
  );
  const loadMoreWeeks = useTeamTimesheet(
    ({ actions }) => actions.loadMoreWeeks,
  );

  const isFilteredDataLoading = isFilterRequest && isLoadingWeeks;

  return (
    <>
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

      {isLoadingSettings || (isLoadingWeeks && weeks.length === 0) ? (
        <Spinner isFull />
      ) : (
        <LoadingOverlay active={isFilteredDataLoading}>
          {weeks.length === 0 && !hasMoreWeeks ? (
            <Typography className="flex justify-center items-center">
              No data
            </Typography>
          ) : (
            <InfiniteScroll
              isLoading={isNextPageLoading}
              hasMore={hasMoreWeeks}
              verticalLodMore={loadMoreWeeks}
              className="w-full h-full"
              scrollResetKey={activeFilterKey}
              enableScrollArea
            >
              <div className="min-w-225">
                {weeks.map((week, index) => (
                  <Fragment key={`${resolvedFilterKey}:${week.key}`}>
                    {index === 0 ? (
                      <div className="sticky top-0 z-20 bg-surface-white">
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
                            crumbClassName:
                              "first:pl-0 last:pr-0 px-0.5 py-0 font-[420]",
                            className: "pl-[8px]",
                          }}
                        />
                      </div>
                    ) : null}

                    <div
                      className={cn("animate-fade-in", index === 0 && "mt-4")}
                    >
                      <TeamTimesheetWeek
                        week={week}
                        defaultExpanded={index < defaultExpandedWeeks}
                        setSelectedTask={setSelectedTask}
                        openWeeklyApproval={(employee, date) =>
                          setWeeklyApproval({ employee, startDate: date })
                        }
                      />
                    </div>
                  </Fragment>
                ))}
              </div>
            </InfiniteScroll>
          )}
        </LoadingOverlay>
      )}
    </>
  );
};

export const TeamTimesheetTable = () => {
  return (
    <div className="w-full flex-1 min-h-0 flex flex-col py-3.5 px-5 relative">
      <SubHeader />
      <TeamTimesheetGrid />
    </div>
  );
};
