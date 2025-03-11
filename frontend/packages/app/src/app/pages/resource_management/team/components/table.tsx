/**
 * External dependencies.
 */
import { useContext, useMemo } from "react";
import { Table, TableBody } from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";
import {
  ResourceTableCell,
  ResourceTableRow,
  ResourceTableHeader as ResourceTeamTableHeader,
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
import { EmptyTableBody, EmptyTableCell } from "../../components/empty";
import { ResourceAllocationList } from "../../components/resourceAllocationList";
import { ResourceFormContext } from "../../store/resourceFormContext";
import {
  defaultEmployeeDayData,
  EmployeeAllWeekDataProps,
  EmployeeDataProps,
  EmployeeResourceProps,
  TeamContext,
} from "../../store/teamContext";
import { AllocationDataProps, DateProps } from "../../store/types";
import { getIsBillableValue } from "../../utils/helper";

/**
 * This component is responsible for loading the table for table view.
 *
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const ResourceTeamTable = ({
  onSubmit,
  cellHeaderRef,
  dateToAddHeaderRef,
  handleVerticalLoadMore,
}: {
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
  cellHeaderRef: React.LegacyRef<HTMLTableCellElement>;
  dateToAddHeaderRef: string;
  handleVerticalLoadMore: () => void;
}) => {
  const { teamData, apiController, getHasMore } = useContext(TeamContext);

  const dates: DateProps[] = teamData.dates;
  const isLoading = apiController.isLoading;
  const hasMore = getHasMore();

  if (dates.length == 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <EmptyTableBody />
      </div>
    );
  }

  return (
    <TableContextProvider>
      <Table className="relative">
        <ResourceTeamTableHeader
          dateToAddHeaderRef={dateToAddHeaderRef}
          cellHeaderRef={cellHeaderRef}
          dates={dates}
          title="Members"
        />
        <InfiniteScroll isLoading={isLoading} hasMore={hasMore} verticalLodMore={handleVerticalLoadMore}>
          <ResourceTeamTableBody onSubmit={onSubmit} />
        </InfiniteScroll>
      </Table>
    </TableContextProvider>
  );
};

/**
 * This function is responsible for rendering the table body for table view.
 *
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const ResourceTeamTableBody = ({
  onSubmit,
}: {
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const { teamData } = useContext(TeamContext);

  const data = teamData.data;
  const dates = teamData.dates;

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
                      let employeeSingleDay = defaultEmployeeDayData;

                      if (date in employeeData.all_dates_data) {
                        employeeSingleDay = employeeData.all_dates_data[date];
                      } else {
                        employeeSingleDay = {
                          ...employeeSingleDay,
                          date: date,
                          total_working_hours: employeeData.employee_daily_working_hours,
                        };
                      }

                      let weekData = {
                        total_allocated_hours: 0,
                        total_working_hours: employeeData.employee_daily_working_hours * 5,
                        total_worked_hours: 0,
                      };

                      if (week.key in employeeData.all_week_data) {
                        weekData = employeeData.all_week_data[week.key];
                      }

                      return (
                        <ResourceTeamTableCell
                          key={`${employeeSingleDay.total_allocated_hours}-id-${Math.random()}`}
                          employeeSingleDay={employeeSingleDay}
                          weekData={weekData}
                          employee={employeeData.name}
                          employee_name={employeeData.employee_name}
                          rowCount={index}
                          midIndex={week_index}
                          employeeAllocations={employeeData.employee_allocations}
                          onSubmit={onSubmit}
                        />
                      );
                    });
                  })}
                </>
              );
            }}
            RowExpandView={() => {
              return <ResourceExpandView employeeData={employeeData} onSubmit={onSubmit} />;
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
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const ResourceTeamTableCell = ({
  employeeSingleDay,
  weekData,
  rowCount,
  employee_name,
  employee,
  midIndex,
  employeeAllocations,
  onSubmit,
}: {
  employeeSingleDay: EmployeeResourceProps;
  weekData: EmployeeAllWeekDataProps;
  rowCount: number;
  employee: string;
  employee_name: string;
  midIndex: number;
  employeeAllocations: ResourceAllocationObjectProps;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const { teamData, tableView, filters } = useContext(TeamContext);

  const customer = teamData.customer;
  const allocationType = filters.allocationType;

  const { date: dateStr, day } = prettyDate(employeeSingleDay.date);
  const title = employee_name + " (" + dateStr + " - " + day + ")";

  const { updateAllocationData, updateDialogState } = useContext(ResourceFormContext);

  const allocationPercentage = useMemo(() => {
    if (tableView.combineWeekHours) {
      if (weekData.total_working_hours == 0) {
        return -1;
      }
      return 100 - (weekData.total_allocated_hours / weekData.total_working_hours) * 100;
    }

    if (employeeSingleDay.total_working_hours == 0) {
      return -1;
    }

    return 100 - (employeeSingleDay.total_allocated_hours / employeeSingleDay.total_working_hours) * 100;
  }, [
    employeeSingleDay.total_allocated_hours,
    employeeSingleDay.total_working_hours,
    tableView.combineWeekHours,
    weekData,
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
            ? `${weekData.total_allocated_hours} / ${weekData.total_working_hours}`
            : `${weekData.total_worked_hours} / ${weekData.total_allocated_hours}`)
        }
      />
    );
  }

  const onCellClick = () => {
    updateDialogState({ isShowDialog: true, isNeedToEdit: false });
    updateAllocationData({
      employee: employee,
      employee_name: employee_name,
      allocation_start_date: employeeSingleDay.date,
      allocation_end_date: employeeSingleDay.date,
      is_billable: getIsBillableValue(allocationType as string[]) != "0",
      total_allocated_hours: "0",
      hours_allocated_per_day: "0",
      note: "",
      project: "",
      project_name: "",
      customer: "",
      customer_name: "",
      name: "",
    });
  };

  if (!tableView.combineWeekHours && !employeeSingleDay.is_on_leave && employeeSingleDay.total_allocated_hours == 0) {
    return (
      <EmptyTableCell
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
            resourceAllocationList={
              employeeSingleDay.employee_resource_allocation_for_given_date as unknown as ResourceAllocationProps[]
            }
            employeeAllocations={employeeAllocations}
            customer={customer}
            onButtonClick={onCellClick}
            onSubmit={onSubmit}
          />
        );
      }}
    />
  );
};

export { ResourceTeamTable };
