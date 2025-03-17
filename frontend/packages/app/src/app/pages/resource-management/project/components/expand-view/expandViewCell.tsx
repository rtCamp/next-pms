/**
 * External dependencies.
 */
import { useContext, useMemo } from "react";
import { prettyDate } from "@next-pms/design-system/date";
import { ResourceTableCell } from "@next-pms/resource-management/components";
import { getTableCellClass, getTodayDateCellClass, getCellBackGroundColor } from "@next-pms/resource-management/utils";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import {
  ResourceAllocationObjectProps,
  ResourceAllocationProps,
  ResourceCustomerObjectProps,
} from "@/types/resource_management";
import { EmptyTableCell } from "../../../components/empty";
import { ResourceAllocationList } from "../../../components/resource-allocation-list/resourceAllocationList";
import { ProjectContext } from "../../../store/projectContext";
import { ResourceFormContext } from "../../../store/resourceFormContext";
import type { AllocationDataProps, EmployeeResourceProps } from "../../../store/types";
import { getIsBillableValue } from "../../../utils/helper";

/**
 * This component is used to display the expand view single cell.
 *
 * @param props.allocationsData The allocation data for the employee.
 * @param props.index The index of the cell.
 * @param props.employeeAllocations The employee allocation data.
 * @param props.customer The customer data.
 * @param props.employee The employee name/ID.
 * @param props.employee_name The employee name.
 * @param props.project The project name/ID.
 * @param props.project_name The project name.
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const ExpandViewCell = ({
  allocationsData,
  index,
  employeeAllocations,
  customer,
  employee,
  employee_name,
  project,
  weekIndex,
  project_name,
  onSubmit,
}: {
  allocationsData: EmployeeResourceProps;
  index: number;
  employee: string;
  employee_name: string;
  project: string;
  weekIndex: number;
  project_name: string;
  employeeAllocations?: ResourceAllocationObjectProps;
  customer: ResourceCustomerObjectProps;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const { tableView, filters } = useContext(ProjectContext);
  const { updateAllocationData, updateDialogState } = useContext(ResourceFormContext);

  const allocationType = filters.allocationType;

  const allocationPercentage = useMemo(() => {
    if (allocationsData.total_allocated_hours == 0) {
      return -1;
    }

    return 100 - (allocationsData.total_worked_hours / allocationsData.total_allocated_hours) * 100;
  }, [allocationsData.total_allocated_hours, allocationsData.total_worked_hours]);

  const cellBackGroundColor = useMemo(() => {
    if (allocationPercentage === -1 || tableView.view == "planned") {
      return "bg-transparent";
    }

    return getCellBackGroundColor(allocationPercentage);
  }, [allocationPercentage, tableView.view]);

  const onCellClick = () => {
    updateDialogState({ isShowDialog: true, isNeedToEdit: false });
    updateAllocationData({
      employee: employee,
      employee_name: employee_name,
      project: project,
      allocation_start_date: allocationsData.date,
      allocation_end_date: allocationsData.date,
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

  const { date: dateStr, day } = prettyDate(allocationsData.date);
  const title = employee_name + " (" + dateStr + " - " + day + ")";

  if (allocationsData.total_allocated_hours == 0 && allocationsData.total_worked_hours == 0) {
    return (
      <EmptyTableCell
        title={title}
        cellClassName={mergeClassNames(
          getTableCellClass(index, weekIndex),
          getTodayDateCellClass(allocationsData.date)
        )}
        onCellClick={onCellClick}
        value={"-"}
      />
    );
  }

  return (
    <ResourceTableCell
      key={index}
      type="hovercard"
      title={title}
      cellClassName={mergeClassNames(
        getTableCellClass(index, weekIndex),
        cellBackGroundColor,
        getTodayDateCellClass(allocationsData.date)
      )}
      value={
        tableView.view == "planned"
          ? allocationsData.total_allocated_hours
          : `${allocationsData.total_worked_hours} / ${allocationsData.total_allocated_hours}`
      }
      CustomHoverCardContent={() => {
        return (
          <ResourceAllocationList
            resourceAllocationList={
              allocationsData.employee_resource_allocation_for_given_date as unknown as ResourceAllocationProps[]
            }
            employeeAllocations={employeeAllocations}
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

export { ExpandViewCell };
