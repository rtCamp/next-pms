/**
 * External dependencies.
 */
import { useMemo, useCallback, memo } from "react";
import { prettyDate } from "@next-pms/design-system/date";
import { ResourceTableCell } from "@next-pms/resource-management/components";
import { getTableCellClass, getTodayDateCellClass, getCellBackGroundColor } from "@next-pms/resource-management/utils";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import type { ResourceAllocationObjectProps, ResourceAllocationProps } from "@/types/resource_management";
import { EmptyTableCell } from "../../../components/empty";
import { ResourceAllocationList } from "../../../components/resource-allocation-list/resourceAllocationList";
import { ResourceFormContext } from "../../../store/resourceFormContext";
import { TeamContext } from "../../../store/teamContext";
import type { AllocationDataProps, EmployeeAllWeekDataProps, EmployeeResourceProps } from "../../../store/types";
import { getIsBillableValue } from "../../../utils/helper";

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
type ResourceTeamTableCellProps = {
  employeeSingleDay: EmployeeResourceProps;
  weekData: EmployeeAllWeekDataProps;
  rowCount: number;
  employee: string;
  employee_name: string;
  midIndex: number;
  employeeAllocations: ResourceAllocationObjectProps;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
};

const ResourceTeamTableCellComponent = ({
  employeeSingleDay,
  weekData,
  rowCount,
  employee_name,
  employee,
  midIndex,
  employeeAllocations,
  onSubmit,
}: ResourceTeamTableCellProps) => {
  const { teamData, tableView, filters } = useContextSelector(TeamContext, (value) => value.state);

  const customer = teamData.customer;
  const allocationType = filters.allocationType;

  const { date: dateStr, day } = prettyDate(employeeSingleDay.date);
  const title = employee_name + " (" + dateStr + " - " + day + ")";

  const { updateAllocationData, updateDialogState } = useContextSelector(ResourceFormContext, (value) => value.actions);

  const allocationPercentage = useMemo(() => {
    if (tableView.combineWeekHours) {
      if (weekData.total_working_hours === 0) return -1;
      return 100 - (weekData.total_allocated_hours / weekData.total_working_hours) * 100;
    }

    if (employeeSingleDay.total_working_hours === 0) return -1;
    return 100 - (employeeSingleDay.total_allocated_hours / employeeSingleDay.total_working_hours) * 100;
  }, [
    employeeSingleDay.total_allocated_hours,
    employeeSingleDay.total_working_hours,
    tableView.combineWeekHours,
    weekData,
  ]);

  const cellBackGroundColor = useMemo(() => getCellBackGroundColor(allocationPercentage), [allocationPercentage]);

  const hasTentativeAllocation = useMemo(
    () =>
      employeeSingleDay.employee_resource_allocation_for_given_date?.some(
        (alloc: AllocationDataProps) => alloc.is_tentative
      ),
    [employeeSingleDay.employee_resource_allocation_for_given_date]
  );

  const onCellClick = useCallback(() => {
    updateDialogState({ isShowDialog: true, isNeedToEdit: false });
    updateAllocationData({
      employee,
      employee_name,
      allocation_start_date: employeeSingleDay.date,
      allocation_end_date: employeeSingleDay.date,
      is_billable: getIsBillableValue(allocationType as string[]) !== "0",
      total_allocated_hours: "0",
      hours_allocated_per_day: "0",
      note: "",
      project: "",
      project_name: "",
      customer: "",
      customer_name: "",
      name: "",
      is_tentative: false,
    });
  }, [allocationType, employee, employeeSingleDay.date, employee_name, updateAllocationData, updateDialogState]);

  const combinedWeekCell = useMemo(() => {
    if (!tableView.combineWeekHours) return null;
    return (
      <ResourceTableCell
        type="default"
        title={title}
        cellClassName={mergeClassNames(
          getTableCellClass(rowCount, midIndex),
          cellBackGroundColor,
          getTodayDateCellClass(employeeSingleDay.date)
        )}
        value={
          rowCount === 2 &&
          (tableView.view === "planned-vs-capacity"
            ? `${weekData.total_allocated_hours} / ${weekData.total_working_hours}`
            : `${weekData.total_worked_hours} / ${weekData.total_allocated_hours}`)
        }
      />
    );
  }, [
    tableView.combineWeekHours,
    title,
    rowCount,
    midIndex,
    cellBackGroundColor,
    employeeSingleDay.date,
    tableView.view,
    weekData,
  ]);

  const emptyDayCell = useMemo(() => {
    if (tableView.combineWeekHours || employeeSingleDay.is_on_leave || employeeSingleDay.total_allocated_hours !== 0)
      return null;
    return (
      <EmptyTableCell
        title={title}
        cellClassName={mergeClassNames(
          getTableCellClass(rowCount, midIndex),
          cellBackGroundColor,
          getTodayDateCellClass(employeeSingleDay.date)
        )}
        onCellClick={onCellClick}
      />
    );
  }, [
    tableView.combineWeekHours,
    employeeSingleDay.is_on_leave,
    employeeSingleDay.total_allocated_hours,
    title,
    rowCount,
    midIndex,
    cellBackGroundColor,
    employeeSingleDay.date,
    onCellClick,
  ]);

  const leaveDayCell = useMemo(() => {
    if (tableView.combineWeekHours || !employeeSingleDay.is_on_leave) return null;
    return (
      <ResourceTableCell
        type="default"
        title={title}
        cellClassName={mergeClassNames(
          getTableCellClass(rowCount),
          cellBackGroundColor,
          getTodayDateCellClass(employeeSingleDay.date)
        )}
        value={employeeSingleDay.total_leave_hours}
      />
    );
  }, [
    tableView.combineWeekHours,
    employeeSingleDay.is_on_leave,
    title,
    rowCount,
    cellBackGroundColor,
    employeeSingleDay.date,
    employeeSingleDay.total_leave_hours,
  ]);

  const hoverCardCell = useMemo(() => {
    if (tableView.combineWeekHours || employeeSingleDay.is_on_leave || employeeSingleDay.total_allocated_hours === 0)
      return null;
    return (
      <ResourceTableCell
        type="hovercard"
        title={title}
        cellClassName={mergeClassNames(
          getTableCellClass(rowCount, midIndex),
          cellBackGroundColor,
          getTodayDateCellClass(employeeSingleDay.date),
          hasTentativeAllocation && "italic"
        )}
        value={
          tableView.view === "planned-vs-capacity"
            ? employeeSingleDay.total_allocated_hours
            : `${employeeSingleDay.total_worked_hours} / ${employeeSingleDay.total_allocated_hours}`
        }
        CustomHoverCardContent={() => (
          <ResourceAllocationList
            resourceAllocationList={
              employeeSingleDay.employee_resource_allocation_for_given_date as unknown as ResourceAllocationProps[]
            }
            employeeAllocations={employeeAllocations}
            customer={customer}
            onButtonClick={onCellClick}
            onSubmit={onSubmit}
          />
        )}
      />
    );
  }, [
    tableView.combineWeekHours,
    tableView.view,
    employeeSingleDay,
    title,
    rowCount,
    midIndex,
    cellBackGroundColor,
    onCellClick,
    employeeAllocations,
    customer,
    onSubmit,
    hasTentativeAllocation,
  ]);

  return combinedWeekCell || emptyDayCell || leaveDayCell || hoverCardCell;
};
const ResourceTeamTableCell = memo(ResourceTeamTableCellComponent);
export { ResourceTeamTableCell };
