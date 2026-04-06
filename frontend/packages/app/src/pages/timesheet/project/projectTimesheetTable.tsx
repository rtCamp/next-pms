/**
 * External dependencies.
 */
import { Fragment, useCallback, useState } from "react";
import { Spinner, Typography } from "@next-pms/design-system/components";
import { Button, Filter, FilterCondition } from "@rtcamp/frappe-ui-react";
import { Ellipsis } from "lucide-react";

/**
 * Internal dependencies.
 */
import SearchTasks from "@/components/filters/searchTasks";
import { InfiniteScroll } from "@/components/infiniteScroll";
import { ProjectTimesheetRow } from "@/components/timesheet-row";
import { HeaderRow } from "@/components/timesheet-row/components/row/headerRow";
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import { TimesheetFilters } from "@/types/timesheet";
import { useProjectTimesheet } from "./context";
import { sampleFields } from "../constants";

export const ProjectTimesheetTable = () => {
  const hasMoreWeeks = useProjectTimesheet(({ state }) => state.hasMoreWeeks);
  const isLoadingProjectData = useProjectTimesheet(
    ({ state }) => state.isLoadingProjectData,
  );
  const weekGroups = useProjectTimesheet(({ state }) => state.weekGroups);
  const loadData = useProjectTimesheet(({ actions }) => actions.loadData);

  const [compositeFilters, setCompositeFilters] = useState<FilterCondition[]>(
    [],
  );
  const [filters, setFilters] = useState<TimesheetFilters>({
    search: "",
    reportsTo: null,
  });

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  return (
    <div className="w-full h-full py-3.5 px-3">
      <div className="flex flex-wrap gap-2 justify-between mb-3.5">
        <div className="flex gap-2">
          <SearchTasks value={filters.search} onChange={handleSearchChange} />
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

      {isLoadingProjectData && weekGroups.length === 0 ? (
        <Spinner isFull />
      ) : weekGroups.length === 0 ? (
        <Typography className="flex items-center justify-center">
          No Data
        </Typography>
      ) : (
        <InfiniteScroll
          isLoading={isLoadingProjectData}
          hasMore={hasMoreWeeks}
          verticalLodMore={loadData}
          className="w-full h-full overflow-auto scrollbar [scrollbar-gutter:stable]"
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
                      projects={week.projects.map((project) => ({
                        project: project.project,
                        projectName: project.projectName,
                        members: project.members.map((member) => ({
                          label: member.employee.employee_name,
                          employee: member.employee.name,
                          avatarUrl: member.employee.image,
                          tasks: member.projectTasks,
                          leaves: member.leaves,
                          holidays: member.holidays,
                          workingHour: member.working_hour,
                          workingFrequency: member.working_frequency,
                          status: member.week.status,
                        })),
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
