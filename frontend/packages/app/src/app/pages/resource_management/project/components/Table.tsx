/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, TableBody } from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";
import { useInfiniteScroll } from "@next-pms/hooks";
/**
 * Internal dependencies.
 */
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import { AllocationDataProps, setResourceFormData } from "@/store/resource_management/allocation";
import {
  emptyProjectDayData,
  ProjectDataProps,
  ProjectResourceProps,
  setMaxWeek,
  setStart,
} from "@/store/resource_management/project";
import { DateProps } from "@/store/resource_management/team";
import { ResourceAllocationObjectProps } from "@/types/resource_management";

import { ResourceExpandView } from "./ExpandView";
import { EmptyTableBody } from "../../components/Empty";
import { InfiniteScroll } from "../../components/InfiniteScroll";
import { ResourceAllocationList } from "../../components/ResourceAllocationList";
import { ResourceTableCell } from "../../components/TableCell";

import ResourceProjectTableHeader from "../../components/TableHeader";
import { ResourceTableRow } from "../../components/TableRow";
import { TableContextProvider } from "../../contexts/tableContext";
import { getCellBackGroundColor } from "../../utils/cell";
import { getIsBillableValue, getTableCellClass, getTodayDateCellClass } from "../../utils/helper";

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
  const dates: DateProps[] = useSelector((state: RootState) => state.resource_project.data.dates);
  const isLoading = useSelector((state: RootState) => state.resource_project.isLoading);
  const maxWeek = useSelector((state: RootState) => state.resource_project.maxWeek);
  const hasMore = useSelector((state: RootState) => state.resource_project.hasMore);
  const start = useSelector((state: RootState) => state.resource_project.start);
  const pageLength = useSelector((state: RootState) => state.resource_project.pageLength);

  const dispatch = useDispatch();

  const handleLoadMore = () => {
    if (isLoading) return;
    dispatch(setMaxWeek(maxWeek + 3));
  };

  const cellHeaderRef = useInfiniteScroll({ isLoading: isLoading, hasMore: true, next: () => handleLoadMore() });

  const handleVerticalLoadMore = () => {
    if (!hasMore) return;
    dispatch(setStart(start + pageLength));
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
        <InfiniteScroll isLoading={isLoading} hasMore={hasMore} verticalLodMore={handleVerticalLoadMore}>
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
  const data = useSelector((state: RootState) => state.resource_project.data.data);
  const dates = useSelector((state: RootState) => state.resource_project.data.dates);
  const allocationType = useSelector((state: RootState) => state.resource_project.allocationType);

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
  allWeekData: any;
  rowCount: number;
  midIndex: number;
  project: string;
  project_name: string;
  projectAllocations: ResourceAllocationObjectProps;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const tableView = useSelector((state: RootState) => state.resource_project.tableView);
  const customer = useSelector((state: RootState) => state.resource_project.data.customer);
  const allocationType = useSelector((state: RootState) => state.resource_project.allocationType);

  const dispatch = useDispatch();

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
    dispatch(
      setResourceFormData({
        isShowDialog: true,
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
        isNeedToEdit: false,
        name: "",
      })
    );
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
            resourceAllocationList={projectSingleDay.project_resource_allocation_for_given_date}
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
