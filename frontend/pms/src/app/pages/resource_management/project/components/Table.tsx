/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

/**
 * Internal dependencies.
 */
import { Table, TableBody } from "@/app/components/ui/table";
import { cn, prettyDate } from "@/lib/utils";
import { RootState } from "@/store";
import { setResourceFormData } from "@/store/resource_management/allocation";
import {
  emptyProjectDayData,
  ProjectDataProps,
  ProjectResourceProps,
  setStart,
} from "@/store/resource_management/project";
import { DateProps } from "@/store/resource_management/team";
import { ResourceAllocationObjectProps } from "@/types/resource_management";

import { ResourceExpandView } from "./ExpandView";
import { EmptyTableBody } from "../../components/Empty";
import { ResourceAllocationList } from "../../components/ResourceAllocationList";
import { ResourceTableCell } from "../../components/TableCell";
import ResourceProjectTableHeader from "../../components/TableHeader";
import { ResourceTableRow } from "../../components/TableRow";
import { getCellBackGroundColor } from "../../utils/cell";
import { getIsBillableValue, getTableCellClass, getTodayDateCellClass } from "../../utils/helper";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { Spinner } from "@/app/components/spinner";

/**
 * This component is responsible for loading the table for project view.
 *
 * @returns React.FC
 */
const ResourceProjectTable = () => {
  const dates: DateProps[] = useSelector((state: RootState) => state.resource_project.data.dates);

  return (
    <Table className="relative">
      <ResourceProjectTableHeader dates={dates} title="Projects" />
      <ResourceProjectTableBody />
    </Table>
  );
};

/**
 * This function is responsible for rendering the table body for project view.
 *
 * @returns React.FC
 */
const ResourceProjectTableBody = () => {
  const data = useSelector((state: RootState) => state.resource_project.data.data);
  const dates = useSelector((state: RootState) => state.resource_project.data.dates);
  const allocationType = useSelector((state: RootState) => state.resource_project.allocationType);
  const start = useSelector((state: RootState) => state.resource_project.start);
  const pageLength = useSelector((state: RootState) => state.resource_project.pageLength);
  const hasMore = useSelector((state: RootState) => state.resource_project.hasMore);
  const isLoading = useSelector((state: RootState) => state.resource_project.isLoading);
  const cellRef = useInfiniteScroll({ isLoading: isLoading, hasMore: hasMore, next: () => handleLoadMore() });
  const dispatch = useDispatch();

  const handleLoadMore = () => {
    if (!hasMore) return;
    dispatch(setStart(start + pageLength));
  };

  if (data.length == 0) {
    return <EmptyTableBody />;
  }

  return (
    <TableBody>
      {data.map((projectData: ProjectDataProps, index: number) => {
        if (!projectData.project_name) {
          return <></>;
        }
        const needToAddRef = hasMore && index == data.length - 2;
        return (
          <ResourceTableRow
            name={projectData.name}
            avatar={projectData.image}
            avatar_abbr={projectData.project_name[0]}
            rowRef={needToAddRef ? cellRef : null}
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
                />
              );
            }}
          />
        );
      })}

      {hasMore && <Spinner isFull={false} className="p-4 overflow-hidden" />}
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
}: {
  projectSingleDay: ProjectResourceProps;
  allWeekData: any;
  rowCount: number;
  midIndex: number;
  project: string;
  project_name: string;
  projectAllocations: ResourceAllocationObjectProps;
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
        employeeName:"",
        project: project,
        allocation_start_date: projectSingleDay.date,
        allocation_end_date: projectSingleDay.date,
        is_billable: getIsBillableValue(allocationType as string[]) != 0,
        customer: "",
        total_allocated_hours: 0,
        hours_allocated_per_day: 0,
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
          />
        );
      }}
    />
  );
};

export { ResourceProjectTable };
