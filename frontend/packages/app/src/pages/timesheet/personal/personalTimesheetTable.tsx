/**
 * External dependencies.
 */
import { Fragment, useState } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { Spinner, Typography } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import PersonalTaskLog from "@/components/task-log/personalTaskLog";
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import { useUser } from "@/providers/user";
import type { WorkingFrequency } from "@/types";
import { usePersonalTimesheet } from "./context";
import { SubHeader } from "./subHeader";
import { InfiniteScroll } from "../../../components/infiniteScroll";
import { HeaderRow } from "../../../components/timesheet-row/components/row/headerRow";
import { PersonalTimesheetRow } from "../../../components/timesheet-row/personalTimesheetRow";
import { useTimesheetOutletContext } from "../outletContext";

const PersonalTimesheetGrid = () => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const hasMoreWeeks = usePersonalTimesheet(({ state }) => state.hasMoreWeeks);
  const isLoadingPersonalData = usePersonalTimesheet(
    ({ state }) => state.isLoadingPersonalData,
  );
  const isInitialLoad = usePersonalTimesheet(
    ({ state }) => state.isInitialLoad,
  );
  const isFilterRequest = usePersonalTimesheet(
    ({ state }) => state.isFilterRequest,
  );
  const timesheetData = usePersonalTimesheet(
    ({ state }) => state.timesheetData,
  );
  const loadData = usePersonalTimesheet(({ actions }) => actions.loadData);
  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const { handleApproval } = useTimesheetOutletContext();

  const isFilteredDataLoading = isFilterRequest && isLoadingPersonalData;
  const hasTaskFilter = usePersonalTimesheet(
    ({ state }) =>
      state.filters.search !== "" ||
      state.compositeFilters.some(
        (filter) =>
          filter.fieldCategory === "Task" || filter.field === "subject",
      ),
  );

  return (
    <>
      {isInitialLoad &&
      isLoadingPersonalData &&
      Object.keys(timesheetData?.data).length == 0 ? (
        <Spinner isFull />
      ) : (
        <>
          {selectedTask && (
            <PersonalTaskLog
              task={selectedTask}
              open={!!selectedTask}
              onOpenChange={(open: boolean) => {
                if (!open) {
                  setSelectedTask(null);
                }
              }}
            />
          )}

          {Object.keys(timesheetData?.data).length == 0 ? (
            <Typography
              className={cn("flex items-center justify-center", {
                "opacity-50 transition-opacity duration-150":
                  isFilteredDataLoading,
              })}
            >
              No data found
            </Typography>
          ) : (
            <InfiniteScroll
              isLoading={isLoadingPersonalData}
              hasMore={!isFilterRequest && hasMoreWeeks}
              verticalLodMore={loadData}
              className={cn(
                "relative w-full h-[calc(100%-var(--spacing)*7)] overflow-auto no-scrollbar opacity-100",
                {
                  "opacity-50 transition-opacity duration-150":
                    isFilteredDataLoading,
                },
              )}
              count={NUMBER_OF_WEEKS_TO_FETCH}
            >
              <div className="min-w-225">
                {Object.entries(timesheetData.data).map(
                  ([key, value], index) => {
                    return (
                      <Fragment key={`${value.start_date}-${value.end_date}`}>
                        {index === 0 ? (
                          <div className="sticky top-0 z-10 mb-4 bg-surface-white">
                            <HeaderRow
                              dates={value.dates}
                              showHeading={true}
                              breadcrumbs={{
                                items: [
                                  { label: "Week", interactive: false },
                                  { label: "Project", interactive: false },
                                  { label: "Task", interactive: false },
                                ],
                                highlightLastItem: false,
                                size: "sm",
                                crumbClassName:
                                  "first:pl-0 px-0.5 py-0 last:pr-0 font-[420]",
                                className: "pl-[8px]",
                              }}
                            />
                          </div>
                        ) : null}
                        <div className="animate-fade-in">
                          <PersonalTimesheetRow
                            label={value.label ?? key}
                            employee={employeeId}
                            workingHour={timesheetData.working_hour}
                            workingFrequency={
                              timesheetData.working_frequency as WorkingFrequency
                            }
                            dates={value.dates}
                            holidays={timesheetData.holidays}
                            leaves={timesheetData.leaves}
                            tasks={value.tasks}
                            firstWeek={index === 0}
                            disabled={value.status === "Approved"}
                            setSelectedTask={setSelectedTask}
                            onButtonClick={() =>
                              handleApproval(
                                value.start_date,
                                value.end_date,
                                value.total_hours,
                              )
                            }
                            status={value.status}
                            hideTotalRow={hasTaskFilter}
                          />
                        </div>
                      </Fragment>
                    );
                  },
                )}
              </div>
            </InfiniteScroll>
          )}

          {isFilteredDataLoading ? (
            <Spinner
              isFull
              className="absolute top-0 left-0 w-full h-full cursor-wait"
            />
          ) : null}
        </>
      )}
    </>
  );
};

export const PersonalTimesheetTable = () => {
  return (
    <div className="w-full flex-1 min-h-0 py-3.5 px-5 relative">
      <SubHeader />
      <PersonalTimesheetGrid />
    </div>
  );
};
