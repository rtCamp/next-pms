/**
 * External dependencies.
 */
import { Fragment } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { Spinner, Typography } from "@next-pms/design-system/components";
import { Button, Filter, TextInput } from "@rtcamp/frappe-ui-react";
import { Ellipsis } from "lucide-react";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import { ProjectTimesheetRow } from "@/components/timesheet-row";
import { HeaderRow } from "@/components/timesheet-row/components/row/headerRow";
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import { useProjectTimesheet } from "./context";
import { projectTimesheetFilters } from "../constants";

export const ProjectTimesheetTable = () => {
  const hasMore = useProjectTimesheet(({ state }) => state.hasMore);
  const isLoadingProjectData = useProjectTimesheet(
    ({ state }) => state.isLoadingProjectData,
  );
  const isFilterRequest = useProjectTimesheet(
    ({ state }) => state.isFilterRequest,
  );
  const weekGroups = useProjectTimesheet(({ state }) => state.weekGroups);
  const searchInput = useProjectTimesheet(({ state }) => state.searchInput);
  const compositeFilters = useProjectTimesheet(
    ({ state }) => state.compositeFilters,
  );
  const loadData = useProjectTimesheet(({ actions }) => actions.loadData);
  const handleSearchChange = useProjectTimesheet(
    ({ actions }) => actions.handleSearchChange,
  );
  const handleCompositeFilterChange = useProjectTimesheet(
    ({ actions }) => actions.handleCompositeFilterChange,
  );

  const isFilteredDataLoading = isFilterRequest && isLoadingProjectData;

  return (
    <div className="w-full flex-1 min-h-0 py-3.5 px-3 relative">
      <div className="flex flex-wrap gap-2 justify-between mb-3.5">
        <div className="flex gap-2">
          <TextInput
            placeholder="Search Tasks"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Filter
            fields={projectTimesheetFilters}
            value={compositeFilters}
            onChange={handleCompositeFilterChange}
          />
          <Button icon={() => <Ellipsis size={16} />} />
        </div>
      </div>

      {isLoadingProjectData && weekGroups.length === 0 ? (
        <Spinner isFull />
      ) : weekGroups.length === 0 ? (
        <Typography className="flex items-center justify-center">
          No Data
        </Typography>
      ) : (
        <InfiniteScroll
          isLoading={isLoadingProjectData}
          hasMore={hasMore}
          verticalLodMore={loadData}
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
                            { label: "Project", interactive: false },
                            { label: "Member", interactive: false },
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
                    <ProjectTimesheetRow
                      label={week.key}
                      dates={week.dates}
                      firstWeek={index === 0}
                      projects={week.projects}
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
