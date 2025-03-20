/**
 * External dependencies.
 */
import { prettyDate } from "@next-pms/design-system/date";
import { ResourceTableCell } from "@next-pms/resource-management/components";
import { getTableCellClass, getTodayDateCellClass } from "@next-pms/resource-management/utils";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import { EmptyTableCell } from "../../../components/empty";
import { ResourceAllocationList } from "../../../components/resource-allocation-list";
import { ResourceFormContext } from "../../../store/resourceFormContext";
import { TeamContext } from "../../../store/teamContext";
import type { AllocationDataProps } from "../../../store/types";
import { ResourceMergeAllocationProps } from "../../../utils/group";
import { getIsBillableValue } from "../../../utils/helper";

/**
 * This component is responsible for loading The expand view cell.
 *
 * @param props.allocationsData The allocation data for the employee.
 * @param props.index The index of the cell.
 * @param props.date The date of the cell.
 * @param props.project The project name/ID.
 * @param props.employee The employee name/ID.
 * @param props.project_name The project name.
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const ExpandViewCell = ({
  allocationsData,
  index,
  date,
  project,
  employee,
  employee_name,
  project_name,
  customer_name,
  weekIndex,
  onSubmit,
}: {
  allocationsData: ResourceMergeAllocationProps;
  index: number;
  date: string;
  project: string;
  employee: string;
  customer_name: string;
  employee_name: string;
  project_name: string;
  weekIndex: number;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const { updateAllocationData, updateDialogState } = useContextSelector(ResourceFormContext, (value) => value);

  const { teamData, filters, tableView } = useContextSelector(TeamContext, (value) => value);

  const { date: dateStr, day } = prettyDate(date);
  const title = project_name + " (" + dateStr + " - " + day + ")";

  const total_allocated_hours = allocationsData ? allocationsData.total_allocated_hours : 0;

  const total_worked_hours = allocationsData ? allocationsData.total_worked_hours_resource_allocation : 0;

  const onCellClick = () => {
    updateDialogState({
      isShowDialog: true,
      isNeedToEdit: false,
    });
    updateAllocationData({
      employee: employee,
      employee_name: employee_name,
      project: project,
      allocation_start_date: date,
      allocation_end_date: date,
      is_billable: getIsBillableValue(filters.allocationType as string[]) != "0",
      customer: customer_name,
      total_allocated_hours: "0",
      hours_allocated_per_day: "0",
      note: "",
      project_name: project_name,
      customer_name: customer_name,
      name: "",
    });
  };

  if (total_allocated_hours == 0 && total_allocated_hours == 0) {
    return (
      <EmptyTableCell
        title={title}
        cellClassName={mergeClassNames(getTableCellClass(index, weekIndex), getTodayDateCellClass(date))}
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
      cellClassName={mergeClassNames(getTableCellClass(index, weekIndex), getTodayDateCellClass(date))}
      value={
        tableView.view == "planned-vs-capacity" || tableView.view == "customer-view"
          ? total_allocated_hours
          : `${total_worked_hours} / ${total_allocated_hours}`
      }
      CustomHoverCardContent={() => {
        return (
          <ResourceAllocationList
            resourceAllocationList={allocationsData.allocations}
            customer={teamData.customer}
            onButtonClick={onCellClick}
            onSubmit={onSubmit}
          />
        );
      }}
    />
  );
};

export { ExpandViewCell };
