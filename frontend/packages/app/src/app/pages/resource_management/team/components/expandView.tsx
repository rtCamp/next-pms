/**
 * External dependencies.
 */
import { useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { Table, TableBody, TableRow } from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";
import {
  ResourceTableCell,
  TableDiableRow,
  TableInformationCellContent,
} from "@next-pms/resource-management/components";
import { getTableCellClass, getTodayDateCellClass } from "@next-pms/resource-management/utils";

/**
 * Internal dependencies.
 */
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import { DateProps, EmployeeDataProps } from "@/store/resource_management/team";
import { EmptyRow } from "../../components/empty";
import { ResourceAllocationList } from "../../components/resourceAllocationList";
import { ResourceFormContext } from "../../store/resourceFormContext";
import { AllocationDataProps } from "../../store/types";
import {
  CombinedResourceDataProps,
  CombinedResourceObjectProps,
  groupAllocations,
  ResourceMergeAllocationProps,
} from "../../utils/group";
import { getIsBillableValue } from "../../utils/helper";

/**
 * This component is responsible for loading Team view expand view data.
 *
 * @param props.employeeData React.FC
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
export const ResourceExpandView = ({
  employeeData,
  onSubmit,
}: {
  employeeData: EmployeeDataProps;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const dates = useSelector((state: RootState) => state.resource_team.data.dates);

  const employeeResourceData: { combinedResourceData: CombinedResourceObjectProps; allDates: string[] } = useMemo(
    findCombineData,
    [employeeData, resourceTeamState.data.dates]
  );

  function findCombineData() {
    return groupAllocations(
      employeeData.all_dates_data,
      employeeData.employee_allocations,
      resourceTeamState.data.dates
    );
  }
  return (
    <Table>
      <TableBody className="[&_tr]:pr-0">
        {Object.keys(employeeResourceData["combinedResourceData"]).length == 0 &&
          Object.keys(employeeData.all_leave_data).length == 0 && <EmptyRow dates={employeeResourceData.allDates} />}
        {Object.entries(employeeResourceData["combinedResourceData"]).length > 0 &&
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //   @ts-ignore
          Object.entries(employeeResourceData["combinedResourceData"]).map(
            ([item, itemData]: [string, CombinedResourceDataProps]) => {
              return (
                <TableRow key={item} className="flex items-center w-full border-0">
                  <TableInformationCellContent
                    cellClassName="pl-12"
                    onClick={() => {
                      window.location.href = `${window.location.origin}/app/project/${item}`;
                    }}
                    value={!item ? "No Project" : `${itemData.project_name}`}
                  />
                  {dates.map((datesList: DateProps, weekIndex: number) => {
                    return datesList?.dates?.map((date: string, index: number) => {
                      return (
                        <ExpandViewCell
                          key={date + "-" + index}
                          index={index}
                          allocationsData={itemData.all_allocation[date]}
                          date={date}
                          employee={employeeData.name}
                          employee_name={employeeData.employee_name}
                          project={item}
                          project_name={itemData.project_name}
                          customer_name={itemData.customer_name || ""}
                          weekIndex={weekIndex}
                          onSubmit={onSubmit}
                        />
                      );
                    });
                  })}
                </TableRow>
              );
            }
          )}

        {Object.keys(employeeData.all_leave_data).length != 0 && (
          <TableDiableRow dates={employeeResourceData.allDates} data={employeeData.all_leave_data} />
        )}
      </TableBody>
    </Table>
  );
};

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
  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const { updateAllocationData, updateDialogState } = useContext(ResourceFormContext);

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
      is_billable: getIsBillableValue(resourceTeamState.allocationType as string[]) != "0",
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
      <ResourceTableCell
        type="empty"
        title={title}
        cellClassName={cn(getTableCellClass(index, weekIndex), getTodayDateCellClass(date))}
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
      cellClassName={cn(getTableCellClass(index, weekIndex), getTodayDateCellClass(date))}
      value={
        resourceTeamState.tableView.view == "planned-vs-capacity" || resourceTeamState.tableView.view == "customer-view"
          ? total_allocated_hours
          : `${total_worked_hours} / ${total_allocated_hours}`
      }
      CustomHoverCardContent={() => {
        return (
          <ResourceAllocationList
            resourceAllocationList={allocationsData.allocations}
            customer={resourceTeamState.data.customer}
            onButtonClick={onCellClick}
            onSubmit={onSubmit}
          />
        );
      }}
    />
  );
};
