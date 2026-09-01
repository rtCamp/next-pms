/**
 * External dependencies.
 */
import { Fragment } from "react";
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
import { HeaderRow } from "@/components/timesheet-row/components/row/headerRow";
import { useDefaultExpandedWeeks } from "@/hooks/useDefaultExpandedWeeks";
import { useProjectTimesheet } from "./context";
import { ProjectTimesheetWeek } from "./projectTimesheetWeek";
import { SubHeader } from "./subHeader";

const ProjectTimesheetGrid = () => {
  const { defaultExpandedWeeks, isLoading: isLoadingSettings } =
    useDefaultExpandedWeeks();
  const weeks = useProjectTimesheet(({ state }) => state.weeks);
  const hasMoreWeeks = useProjectTimesheet(({ state }) => state.hasMoreWeeks);
  const isLoadingWeeks = useProjectTimesheet(
    ({ state }) => state.isLoadingWeeks,
  );
  const isNextPageLoading = useProjectTimesheet(
    ({ state }) => state.isNextPageLoading,
  );
  const isFilterRequest = useProjectTimesheet(
    ({ state }) => state.isFilterRequest,
  );
  const activeFilterKey = useProjectTimesheet(
    ({ state }) => state.activeFilterKey,
  );
  const resolvedFilterKey = useProjectTimesheet(
    ({ state }) => state.resolvedFilterKey,
  );
  const loadMoreWeeks = useProjectTimesheet(
    ({ actions }) => actions.loadMoreWeeks,
  );

  const isFilteredDataLoading = isFilterRequest && isLoadingWeeks;

  return (
    <>
      {isLoadingSettings || (isLoadingWeeks && weeks.length === 0) ? (
        <Spinner isFull />
      ) : (
        <LoadingOverlay active={isFilteredDataLoading}>
          {weeks.length === 0 && !hasMoreWeeks ? (
            <Typography className="flex items-center justify-center">
              No data found
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
                {weeks.map((week, index) => {
                  return (
                    <Fragment key={`${resolvedFilterKey}:${week.key}`}>
                      {index === 0 ? (
                        <div className="sticky top-0 z-20 bg-surface-white">
                          <HeaderRow
                            dates={week.dates}
                            showHeading={true}
                            breadcrumbs={{
                              items: [
                                { label: "Week", interactive: false },
                                { label: "Project", interactive: false },
                                { label: "Member", interactive: false },
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
                        <ProjectTimesheetWeek
                          week={week}
                          defaultExpanded={index < defaultExpandedWeeks}
                        />
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            </InfiniteScroll>
          )}
        </LoadingOverlay>
      )}
    </>
  );
};

export const ProjectTimesheetTable = () => {
  return (
    <div className="w-full flex-1 min-h-0 flex flex-col py-3.5 px-5 relative">
      <SubHeader />
      <ProjectTimesheetGrid />
    </div>
  );
};
