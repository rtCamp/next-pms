/**
 * External dependencies.
 */
import { useContext, useMemo } from "react";
import { Table, TableBody } from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";
import { useInfiniteScroll } from "@next-pms/hooks";
import {
  ResourceTableCell,
  ResourceTableRow,
  ResourceTableHeader as ResourceProjectTableHeader,
} from "@next-pms/resource-management/components";
import { TableContextProvider } from "@next-pms/resource-management/store";
import { getTableCellClass, getTodayDateCellClass, getCellBackGroundColor } from "@next-pms/resource-management/utils";
import { InfiniteScroll } from "@/app/components/infiniteScroll";

/**
 * Internal dependencies.
 */
import { cn } from "@/lib/utils";
import { ResourceAllocationObjectProps, ResourceAllocationProps } from "@/types/resource_management";

import { ResourceExpandView } from "./expandView";
import { EmptyTableBody } from "../../components/empty";
import { ResourceAllocationList } from "../../components/resourceAllocationList";
import {
  emptyProjectDayData,
  ProjectAllWeekDataProps,
  ProjectContext,
  ProjectDataProps,
  ProjectResourceProps,
} from "../../store/projectContext";
import { ResourceFormContext } from "../../store/resourceFormContext";
import { AllocationDataProps, DateProps } from "../../store/types";
import { getIsBillableValue } from "../../utils/helper";

/**
 * This component is responsible for loading the table for project view.
 *
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @param props.dateToAddHeaderRef The date to add header ref.
 * @returns React.FC
 */
const ResourceProjectTable = ({
  onSubmit,
  dateToAddHeaderRef,
}: {
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
  dateToAddHeaderRef: string;
}) => {
  const { projectData, filters, apiController, getHasMore, setMaxWeek, setStart } = useContext(ProjectContext);

  const dates: DateProps[] = projectData.dates;
  const isLoading = apiController.isLoading;
  const maxWeek = filters.maxWeek;
  const hasMore = getHasMore();
  const start = filters.start;
  const pageLength = filters.pageLength;

  const handleLoadMore = () => {
    if (isLoading) return;
    setMaxWeek(maxWeek + 3);
  };

  const cellHeaderRef = useInfiniteScroll({ isLoading: isLoading, hasMore: true, next: () => handleLoadMore() });

  const handleVerticalLoadMore = () => {
    if (!hasMore) return;
    setStart(start + pageLength);
  };

  if (dates.length == 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <EmptyTableBody />
      </div>
    );
  }

  return (
    <TableContextProvider>
      <Table className="w-screen">
        <ResourceProjectTableHeader
          dates={dates}
          title="Projects"
          cellHeaderRef={cellHeaderRef}
          dateToAddHeaderRef={dateToAddHeaderRef}
        />
        <InfiniteScroll isLoading={isLoading ? true : false} hasMore={hasMore} verticalLodMore={handleVerticalLoadMore}>
          <ResourceProjectTableBody onSubmit={onSubmit} />
        </InfiniteScroll>
      </Table>
    </TableContextProvider>
  );
};

/**
 * This function is responsible for rendering the table body for project view.
 *
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const ResourceProjectTableBody = ({
  onSubmit,
}: {
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const { projectData, filters } = useContext(ProjectContext);

  const data = projectData.data;
  const dates = projectData.dates;
  const allocationType = filters.allocationType;

  if (data.length == 0) {
    return <EmptyTableBody />;
  }

  return (
    <TableBody>
      {data.map((projectData: ProjectDataProps) => {
        if (!projectData.project_name) {
          return <></>;
        }
        return (
          <ResourceTableRow
            name={projectData.name}
            avatar={projectData.image}
            avatar_abbr={projectData.project_name[0]}
            avatar_name={projectData.project_name}
            RowComponent={() => {
              return (
                <>
                  {dates.map((week: DateProps, week_index: number) => {
                    return week.dates.map((date: string, index: number) => {
                      let projectSingleDay = emptyProjectDayData;

                      if (date in projectData.all_dates_data) {
                        projectSingleDay = projectData.all_dates_data[date];
                      } else {
                        projectSingleDay = {
                          ...emptyProjectDayData,
                          date: date,
                        };
                      }

                      return (
                        <ResourceProjectTableCell
                          key={`${projectSingleDay.total_allocated_hours}-id-${Math.random()}`}
                          projectSingleDay={projectSingleDay}
                          allWeekData={projectData.all_week_data}
                          rowCount={index}
                          midIndex={week_index}
                          projectAllocations={projectData.project_allocations}
                          project={projectData.name}
                          project_name={projectData.project_name}
                          onSubmit={onSubmit}
                        />
                      );
                    });
                  })}
                </>
              );
            }}
            RowExpandView={() => {
              return (
                <ResourceExpandView
                  project={projectData.name}
                  project_name={projectData.project_name}
                  start_date={dates[0].start_date}
                  end_date={dates[dates.length - 1].end_date}
                  is_billable={getIsBillableValue(allocationType as string[])}
                  onSubmit={onSubmit}
                />
              );
            }}
          />
        );
      })}
    </TableBody>
  );
};

/**
 * This component is responsible for loading the single cell of project view.
 *
 * @param props.projectSingleDay The project single day all resources data.
 * @param props.allWeekData The all week data for the project.
 * @param props.rowCount The row count. use to show the border of cell.
 * @param props.midIndex The mid index. use to find the values of combine week views.
 * @param props.projectAllocations The project allocations data.
 * @param props.project The project name/ID.
 * @param props.project_name The project name.
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const ResourceProjectTableCell = ({
  projectSingleDay,
  allWeekData,
  rowCount,
  midIndex,
  projectAllocations,
  project,
  project_name,
  onSubmit,
}: {
  projectSingleDay: ProjectResourceProps;
  allWeekData: ProjectAllWeekDataProps[];
  rowCount: number;
  midIndex: number;
  project: string;
  project_name: string;
  projectAllocations: ResourceAllocationObjectProps;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const { projectData, tableView, filters } = useContext(ProjectContext);

  const customer = projectData.customer;
  const allocationType = filters.allocationType;

  const { updateAllocationData, updateDialogState } = useContext(ResourceFormContext);

  const allocationPercentage = useMemo(() => {
    if (tableView.combineWeekHours) {
      if (allWeekData[midIndex].total_allocated_hours == 0) {
        return -1;
      }
      return 100 - (allWeekData[midIndex].total_worked_hours / allWeekData[midIndex].total_allocated_hours) * 100;
    }

    if (projectSingleDay.total_allocated_hours == 0) {
      return -1;
    }

    return 100 - (projectSingleDay.total_worked_hours / projectSingleDay.total_allocated_hours) * 100;
  }, [
    allWeekData,
    midIndex,
    projectSingleDay.total_allocated_hours,
    projectSingleDay.total_worked_hours,
    tableView.combineWeekHours,
  ]);

  const cellBackGroundColor = useMemo(() => {
    if (allocationPercentage === -1 || tableView.view == "planned") {
      return "bg-transparent";
    }

    return getCellBackGroundColor(allocationPercentage);
  }, [allocationPercentage, tableView.view]);

  const cellValue = useMemo(() => {
    let allocated_hours = 0,
      worked_hours = 0;
    if (tableView.combineWeekHours) {
      if (!(rowCount == 2)) {
        return "";
      }

      allocated_hours = allWeekData[midIndex].total_allocated_hours;
      worked_hours = allWeekData[midIndex].total_worked_hours;
    } else {
      allocated_hours = projectSingleDay.total_allocated_hours;
      worked_hours = projectSingleDay.total_worked_hours;
    }

    if (tableView.view == "planned") {
      if (!allocated_hours) {
        return "-";
      }
      return allocated_hours;
    }

    if (!worked_hours && !allocated_hours) {
      return "-";
    }

    return `${worked_hours} / ${allocated_hours}`;
  }, [
    allWeekData,
    midIndex,
    projectSingleDay.total_allocated_hours,
    projectSingleDay.total_worked_hours,
    rowCount,
    tableView.combineWeekHours,
    tableView.view,
  ]);

  const onCellClick = () => {
    updateDialogState({ isShowDialog: true, isNeedToEdit: false });
    updateAllocationData({
      employee: "",
      employee_name: "",
      project: project,
      allocation_start_date: projectSingleDay.date,
      allocation_end_date: projectSingleDay.date,
      is_billable: getIsBillableValue(allocationType as string[]) != "0",
      customer: "",
      total_allocated_hours: "0",
      hours_allocated_per_day: "0",
      note: "",
      project_name: project_name,
      customer_name: "",
      name: "",
    });
  };

  const { date: dateStr, day } = prettyDate(projectSingleDay.date);
  const title = project_name + " (" + dateStr + " - " + day + ")";

  if (tableView.combineWeekHours) {
    return (
      <ResourceTableCell
        type="default"
        title={title}
        cellClassName={cn(
          getTableCellClass(rowCount, midIndex),
          cellBackGroundColor,
          getTodayDateCellClass(projectSingleDay.date)
        )}
        value={cellValue}
      />
    );
  }

  if (cellValue == "-") {
    return (
      <ResourceTableCell
        type="empty"
        title={title}
        cellClassName={cn(
          getTableCellClass(rowCount, midIndex),
          cellBackGroundColor,
          getTodayDateCellClass(projectSingleDay.date)
        )}
        value={""}
        onCellClick={onCellClick}
      />
    );
  }

  return (
    <ResourceTableCell
      type="hovercard"
      title={title}
      cellClassName={cn(
        getTableCellClass(rowCount, midIndex),
        cellBackGroundColor,
        getTodayDateCellClass(projectSingleDay.date)
      )}
      value={cellValue}
      CustomHoverCardContent={() => {
        return (
          <ResourceAllocationList
            resourceAllocationList={
              projectSingleDay.project_resource_allocation_for_given_date as unknown as ResourceAllocationProps[]
            }
            employeeAllocations={projectAllocations}
            customer={customer}
            onButtonClick={onCellClick}
            viewType={"project"}
            onSubmit={onSubmit}
          />
        );
      }}
    />
  );
};

export { ResourceProjectTable };
