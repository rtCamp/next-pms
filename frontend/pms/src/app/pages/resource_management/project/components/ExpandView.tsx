import { Table, TableBody, TableRow } from "@/app/components/ui/table";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { getTableCellClass } from "../../utils/helper";
import { ResourceAllocationList } from "../../components/Card";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ResourceTableCell, TableInformationCellContent } from "../../components/TableCell";
import { ResourceAllocationObjectProps, ResourceCustomerObjectProps } from "@/types/resource_management";
import { useMemo } from "react";
import { getCellBackGroundColor } from "../../utils/cell";
import { cn, prettyDate } from "@/lib/utils";
import { setResourceFormData } from "@/store/resource_management/allocation";

interface ResourceExpandViewProps {
  project: string;
  project_name: string;
  start_date: string;
  end_date: string;
  is_billable: boolean;
}

export const ResourceExpandView = ({
  project,
  project_name,
  start_date,
  end_date,
  is_billable,
}: ResourceExpandViewProps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const { data } = useFrappeGetCall(
    "next_pms.resource_management.api.project.get_employees_resrouce_data_for_given_project",
    {
      project: project,
      start_date: start_date,
      end_date: end_date,
      is_billable: is_billable,
    },
    undefined,
    {
      revalidateIfStale: false,
    }
  );

  return (
    <Table>
      <TableBody className="[&_tr]:pr-0">
        {data &&
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //   @ts-ignore
          data.message.data.map((employeeData: any) => {
            return (
              <TableRow key={employeeData.name} className="flex items-center w-full border-0">
                <TableInformationCellContent
                  cellClassName="overflow-hidden flex items-center pl-6 font-normal hover:underline"
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

                {employeeData.all_dates_date.map((employeeSingleDayData: any, index: number) => {
                  return (
                    <ExpandViewCell
                      key={employeeSingleDayData.date + "-" + index}
                      index={index}
                      allocationsData={employeeSingleDayData}
                      employeeAllocations={employeeData.allocations}
                      customer={data.message.customer}
                      employee={employeeData.name}
                      employee_name={employeeData.employee_name}
                      project={project}
                      project_name={project_name}
                    />
                  );
                })}
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
};

const ExpandViewCell = ({
  allocationsData,
  index,
  employeeAllocations,
  customer,
  employee,
  employee_name,
  project,
  project_name,
}: {
  allocationsData: any;
  index: number;
  employee: string;
  employee_name: string;
  project: string;
  project_name: string;
  employeeAllocations?: ResourceAllocationObjectProps;
  customer: ResourceCustomerObjectProps;
}) => {
  const tableView = useSelector((state: RootState) => state.resource_project.tableView);
  const isBillable = useSelector((state: RootState) => state.resource_project.isBillable);

  const dispatch = useDispatch();

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
    dispatch(
      setResourceFormData({
        isShowDialog: true,
        employee: employee,
        project: project,
        allocation_start_date: allocationsData.date,
        allocation_end_date: allocationsData.date,
        is_billable: isBillable != 0,
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

  const { date: dateStr, day } = prettyDate(allocationsData.date);
  const title = employee_name + " (" + dateStr + " - " + day + ")";

  if (allocationsData.total_allocated_hours == 0 && allocationsData.total_worked_hours == 0) {
    return (
      <ResourceTableCell
        type="empty"
        title={title}
        cellClassName={getTableCellClass(index)}
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
      cellClassName={cn(getTableCellClass(index), cellBackGroundColor)}
      value={
        tableView.view == "planned"
          ? allocationsData.total_allocated_hours
          : `${allocationsData.total_worked_hours} / ${allocationsData.total_allocated_hours}`
      }
      CustomHoverCardContent={() => {
        return (
          <ResourceAllocationList
            resourceAllocationList={allocationsData.employee_resource_allocation_for_given_date}
            employeeAllocations={employeeAllocations}
            customer={customer}
            onButtonClick={onCellClick}
            viewType={"project"}
          />
        );
      }}
    />
  );
};
