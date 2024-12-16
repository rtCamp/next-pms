import { Table, TableBody, TableCell, TableRow } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { EmployeeDataProps } from "@/store/resource_management/team";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { getTableCellClass } from "../../utils/helper";
import { ResourceAllocationList } from "../../components/Card";
import { CombinedResourceObjectProps, CombinedResourceDataProps, groupAllocations } from "../../utils/group";
import { EmptyRow } from "../../components/Empty";
import { setResourceFormData } from "@/store/resource_management/allocation";
import { ResourceTableCell, TableInformationCellContent } from "../../components/TableCell";
import { cn, prettyDate } from "@/lib/utils";

export const ResourceExpandView = ({ employeeData }: { employeeData: EmployeeDataProps }) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const resourceTeamState = useSelector((state: RootState) => state.resource_team);

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
                  {employeeResourceData.allDates.map((date: string, index: number) => {
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
                      />
                    );
                  })}
                </TableRow>
              );
            }
          )}

        {Object.keys(employeeData.all_leave_data).length != 0 && (
          <TimeOffRow dates={employeeResourceData.allDates} employeeData={employeeData} />
        )}
      </TableBody>
    </Table>
  );
};

const ExpandViewCell = ({
  allocationsData,
  index,
  date,
  project,
  employee,
  employee_name,
  project_name,
}: {
  allocationsData: any;
  index: number;
  date: string;
  project: string;
  employee: string;
  customer_name?: string;
  employee_name?: string;
  project_name: string;
}) => {
  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const dispatch = useDispatch();

  const { date: dateStr, day } = prettyDate(date);
  const title = project_name + " (" + dateStr + " - " + day + ")";

  const total_allocated_hours = allocationsData ? allocationsData.total_allocated_hours : 0;

  const total_worked_hours = allocationsData ? allocationsData.total_worked_hours_resource_allocation : 0;

  const onCellClick = () => {
    dispatch(
      setResourceFormData({
        isShowDialog: true,
        employee: employee,
        project: project,
        allocation_start_date: date,
        allocation_end_date: date,
        is_billable: resourceTeamState.isBillable != 0,
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

  if (total_allocated_hours == 0 && total_allocated_hours == 0) {
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
      cellClassName={getTableCellClass(index)}
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
          />
        );
      }}
    />
  );
};

const TimeOffRow = ({ dates, employeeData }: { dates: string[]; employeeData: EmployeeDataProps }) => {
  return (
    <TableRow className="flex items-center w-full border-0">
      <TableInformationCellContent value="Time Off" />

      {dates.map((date: string, index: number) => {
        return (
          <ResourceTableCell
            type="default"
            key={date}
            cellClassName={cn(getTableCellClass(index),"bg-gray-200")}
            value={employeeData.all_leave_data[date] ? employeeData.all_leave_data[date] : "-"}
          />
        );
      })}
    </TableRow>
  );
};
