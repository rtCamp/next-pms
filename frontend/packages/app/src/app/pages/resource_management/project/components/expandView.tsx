/**
 * External dependencies.
 */
import { useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage, Table, TableBody, TableRow } from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";
import { ResourceTableCell, TableInformationCellContent } from "@next-pms/resource-management/components";
import { getTableCellClass, getTodayDateCellClass, getCellBackGroundColor } from "@next-pms/resource-management/utils";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import { DateProps, EmployeeDataProps, EmployeeResourceProps } from "@/store/resource_management/team";
import {
  ResourceAllocationObjectProps,
  ResourceAllocationProps,
  ResourceCustomerObjectProps,
} from "@/types/resource_management";
import { ResourceAllocationList } from "../../components/resourceAllocationList";
import { ResourceFormContext } from "../../store/resourceFormContext";
import { AllocationDataProps } from "../../store/types";
import { getIsBillableValue } from "../../utils/helper";

interface ResourceExpandViewProps {
  project: string;
  project_name: string;
  start_date: string;
  end_date: string;
  is_billable: string;
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}

/**
 * This component is responsible for loading expand view of resource allocation project view. shows the employee wise allocation data.
 *
 * @param props.project The project name/ID.
 * @param props.project_name The name of the project
 * @param props.start_date The start date from which data need to show.
 * @param props.end_date The end date till whihc data need to show.
 * @param props.is_billable The is billable flag.
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
export const ResourceExpandView = ({
  project,
  project_name,
  start_date,
  end_date,
  is_billable,
  onSubmit,
}: ResourceExpandViewProps) => {
  const dates = useSelector((state: RootState) => state.resource_project.data.dates);

  const { data } = useFrappeGetCall(
    "next_pms.resource_management.api.project.get_employees_resrouce_data_for_given_project",
    {
      project: project,
      start_date: start_date,
      end_date: end_date,
      is_billable: is_billable,
    },
    undefined
  );

  return (
    <Table>
      <TableBody className="[&_tr]:pr-0">
        {data &&
          data.message.data.map((employeeData: EmployeeDataProps & { allocations: ResourceAllocationObjectProps }) => {
            return (
              <TableRow key={employeeData.name} className="flex items-center w-full border-0">
                <TableInformationCellContent
                  cellClassName="overflow-hidden flex items-center pl-10 font-normal hover:underline"
                  CellComponet={() => {
                    return (
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={decodeURIComponent(employeeData.image)} />
                        <AvatarFallback>{employeeData.employee_name}</AvatarFallback>
                      </Avatar>
                    );
                  }}
                  value={employeeData.employee_name}
                />

                {dates.map((item: DateProps, weekIndex: number) => {
                  return item?.dates?.map((date, index: number) => {
                    let employeeSingleDayData: EmployeeResourceProps = {
                      date: "",
                      total_allocated_hours: 0,
                      total_worked_hours: 0,
                      employee_resource_allocation_for_given_date: [],
                      total_working_hours: 0,
                      is_on_leave: false,
                      total_leave_hours: 0,
                      total_allocation_count: 0,
                    };

                    if (date in employeeData.all_dates_data) {
                      employeeSingleDayData = employeeData.all_dates_data[date];
                    } else {
                      employeeSingleDayData = {
                        ...employeeSingleDayData,
                        date: date,
                      };
                    }
                    return (
                      <ExpandViewCell
                        key={employeeSingleDayData.date + "-" + index}
                        index={index}
                        weekIndex={weekIndex}
                        allocationsData={employeeSingleDayData}
                        employeeAllocations={employeeData.allocations}
                        customer={data.message.customer}
                        employee={employeeData.name}
                        employee_name={employeeData.employee_name}
                        project={project}
                        project_name={project_name}
                        onSubmit={onSubmit}
                      />
                    );
                  });
                })}
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
};

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
  const tableView = useSelector((state: RootState) => state.resource_project.tableView);
  const allocationType = useSelector((state: RootState) => state.resource_project.allocationType);

  const { updateAllocationData, updateDialogState } = useContext(ResourceFormContext);

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
      <ResourceTableCell
        type="empty"
        title={title}
        cellClassName={cn(getTableCellClass(index, weekIndex), getTodayDateCellClass(allocationsData.date))}
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
      cellClassName={cn(
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
