/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

/**
 * Internal dependencies.
 */
import { Table, TableBody } from "@/app/components/ui/table";
import { InfiniteScroll } from "@/app/pages/resource_management/components/InfiniteScroll";
import { cn, prettyDate } from "@/lib/utils";
import { RootState } from "@/store";
import { setResourceFormData } from "@/store/resource_management/allocation";
import {
  DateProps,
  EmployeeDataProps,
  EmployeeResourceProps,
  emptyEmployeeDayData,
  setMaxWeek,
  setStart,
} from "@/store/resource_management/team";
import { ResourceAllocationObjectProps } from "@/types/resource_management";

import { ResourceExpandView } from "./ExpandView";
import { EmptyTableBody } from "../../components/Empty";
import { ResourceAllocationList } from "../../components/ResourceAllocationList";
import { ResourceTableCell } from "../../components/TableCell";
import ResourceTeamTableHeader from "../../components/TableHeader";
import { ResourceTableRow } from "../../components/TableRow";
import { TableContextProvider } from "../../contexts/tableContext";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { getCellBackGroundColor } from "../../utils/cell";
import { getIsBillableValue, getTableCellClass, getTodayDateCellClass } from "../../utils/helper";

/**
 * This component is responsible for loading the table for table view.
 *
 * @returns React.FC
 */
const ResourceTeamTable = () => {
  const dates: DateProps[] = useSelector((state: RootState) => state.resource_team.data.dates);
  const isLoading = useSelector((state: RootState) => state.resource_team.isLoading);
  const maxWeek = useSelector((state: RootState) => state.resource_team.maxWeek);
  const start = useSelector((state: RootState) => state.resource_team.start);
  const pageLength = useSelector((state: RootState) => state.resource_team.pageLength);
  const hasMore = useSelector((state: RootState) => state.resource_team.hasMore);
  const dispatch = useDispatch();

  const handleVerticalLoadMore = () => {
    if (!hasMore) return;
    dispatch(setStart(start + pageLength));
  };

  const handleLoadMore = () => {
    if (isLoading) return;
    dispatch(setMaxWeek(maxWeek + 3));
  };

  const cellHeaderRef = useInfiniteScroll({ isLoading: isLoading, hasMore: true, next: () => handleLoadMore() });

  return (
    <TableContextProvider>
      <Table className="relative">
        <ResourceTeamTableHeader headerRef={cellHeaderRef} dates={dates} title="Members" />
        <InfiniteScroll isLoading={isLoading} hasMore={hasMore} verticalLodMore={handleVerticalLoadMore}>
          <ResourceTeamTableBody />
        </InfiniteScroll>
      </Table>
    </TableContextProvider>
  );
};

/**
 * This function is responsible for rendering the table body for table view.
 *
 * @returns React.FC
 */
const ResourceTeamTableBody = () => {
  const data = useSelector((state: RootState) => state.resource_team.data.data);
  const dates: DateProps[] = useSelector((state: RootState) => state.resource_team.data.dates);

  if (data.length == 0) {
    return <EmptyTableBody />;
  }

  return (
    <TableBody>
      {data.map((employeeData: EmployeeDataProps) => {
        return (
          <ResourceTableRow
            key={employeeData.name}
            name={employeeData.name}
            avatar={employeeData.image}
            avatar_abbr={employeeData.employee_name}
            avatar_name={employeeData.employee_name}
            RowComponent={() => {
              return (
                <>
                  {dates.map((week: DateProps, week_index: number) => {
                    return week.dates.map((date: string, index: number) => {
                      let employeeSingleDay = emptyEmployeeDayData;

                      if (date in employeeData.all_dates_data) {
                        employeeSingleDay = employeeData.all_dates_data[date];
                      } else {
                        employeeSingleDay = {
                          ...employeeSingleDay,
                          date: date,
                          total_working_hours: employeeData.employee_daily_working_hours,
                        };
                      }

                      return (
                        <ResourceTeamTableCell
                          key={`${employeeSingleDay.total_allocated_hours}-id-${Math.random()}`}
                          employeeSingleDay={employeeSingleDay}
                          allWeekData={employeeData.all_week_data}
                          employee={employeeData.name}
                          employee_name={employeeData.employee_name}
                          rowCount={index}
                          midIndex={week_index}
                          employeeAllocations={employeeData.employee_allocations}
                        />
                      );
                    });
                  })}
                </>
              );
            }}
            RowExpandView={() => {
              return <ResourceExpandView employeeData={employeeData} />;
            }}
          />
        );
      })}
    </TableBody>
  );
};

/**
 * This component is responsible for loading the single cell of table view.
 *
 * @param props.employeeSingleDay The employee single day all resources data.
 * @param props.allWeekData The all week data for the employee.
 * @param props.rowCount The row count of the cell.
 * @param props.employee The employee name/ID.
 * @param props.employee_name The employee name.
 * @param props.max_allocation_count_for_single_date The max allocation count for the single date.
 * @param props.midIndex The mid index of the cell.
 * @param props.employeeAllocations The employee allocation data.
 * @returns React.FC
 */
const ResourceTeamTableCell = ({
  employeeSingleDay,
  allWeekData,
  rowCount,
  employee_name,
  employee,
  midIndex,
  employeeAllocations,
}: {
  employeeSingleDay: EmployeeResourceProps;
  allWeekData: any;
  rowCount: number;
  employee: string;
  employee_name: string;
  midIndex: number;
  employeeAllocations: ResourceAllocationObjectProps;
}) => {
  const tableView = useSelector((state: RootState) => state.resource_team.tableView);
  const customer = useSelector((state: RootState) => state.resource_team.data.customer);
  const allocationType = useSelector((state: RootState) => state.resource_team.allocationType);

  const { date: dateStr, day } = prettyDate(employeeSingleDay.date);
  const title = employee_name + " (" + dateStr + " - " + day + ")";

  const dispatch = useDispatch();

  const allocationPercentage = useMemo(() => {
    if (tableView.combineWeekHours) {
      if (allWeekData[midIndex].total_working_hours == 0) {
        return -1;
      }
      return 100 - (allWeekData[midIndex].total_allocated_hours / allWeekData[midIndex].total_working_hours) * 100;
    }

    if (employeeSingleDay.total_working_hours == 0) {
      return -1;
    }

    return 100 - (employeeSingleDay.total_allocated_hours / employeeSingleDay.total_working_hours) * 100;
  }, [
    allWeekData,
    employeeSingleDay.total_allocated_hours,
    employeeSingleDay.total_working_hours,
    midIndex,
    tableView.combineWeekHours,
  ]);

  const cellBackGroundColor = useMemo(() => getCellBackGroundColor(allocationPercentage), [allocationPercentage]);

  if (tableView.combineWeekHours) {
    return (
      <ResourceTableCell
        type="default"
        title={title}
        cellClassName={cn(
          getTableCellClass(rowCount, midIndex),
          cellBackGroundColor,
          getTodayDateCellClass(employeeSingleDay.date)
        )}
        value={
          rowCount == 2 &&
          (tableView.view == "planned-vs-capacity"
            ? `${allWeekData[midIndex].total_allocated_hours} / ${allWeekData[midIndex].total_working_hours}`
            : `${allWeekData[midIndex].total_worked_hours} / ${allWeekData[midIndex].total_allocated_hours}`)
        }
      />
    );
  }

  const onCellClick = () => {
    dispatch(
      setResourceFormData({
        isShowDialog: true,
        employee: employee,
        employee_name: employee_name,
        allocation_start_date: employeeSingleDay.date,
        allocation_end_date: employeeSingleDay.date,
        is_billable: getIsBillableValue(allocationType as string[]) != 0,
        total_allocated_hours: 0,
        hours_allocated_per_day: 0,
        note: "",
        project: "",
        project_name: "",
        customer: "",
        customer_name: "",
        isNeedToEdit: false,
        name: "",
      })
    );
  };

  if (!tableView.combineWeekHours && !employeeSingleDay.is_on_leave && employeeSingleDay.total_allocated_hours == 0) {
    return (
      <ResourceTableCell
        type="empty"
        title={title}
        cellClassName={cn(
          getTableCellClass(rowCount, midIndex),
          cellBackGroundColor,
          getTodayDateCellClass(employeeSingleDay.date)
        )}
        onCellClick={onCellClick}
        value={""}
      />
    );
  }

  if (!tableView.combineWeekHours && employeeSingleDay.is_on_leave) {
    return (
      <ResourceTableCell
        type="default"
        title={title}
        cellClassName={cn(
          getTableCellClass(rowCount),
          cellBackGroundColor,
          getTodayDateCellClass(employeeSingleDay.date)
        )}
        value={employeeSingleDay.total_leave_hours}
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
        getTodayDateCellClass(employeeSingleDay.date)
      )}
      value={
        tableView.view == "planned-vs-capacity"
          ? employeeSingleDay.total_allocated_hours
          : `${employeeSingleDay.total_worked_hours} / ${employeeSingleDay.total_allocated_hours}`
      }
      CustomHoverCardContent={() => {
        return (
          <ResourceAllocationList
            resourceAllocationList={employeeSingleDay.employee_resource_allocation_for_given_date}
            employeeAllocations={employeeAllocations}
            customer={customer}
            onButtonClick={onCellClick}
          />
        );
      }}
    />
  );
};

export { ResourceTeamTable };
