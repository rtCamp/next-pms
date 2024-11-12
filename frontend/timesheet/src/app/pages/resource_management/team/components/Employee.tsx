import { Table, TableBody, TableCell, TableRow } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { cn, floatToTime, getDateFromDateAndTime } from "@/lib/utils";
import { CircleDollarSign } from "lucide-react";
import { TaskDataProps, TaskDataItemProps } from "@/types/timesheet";
import { EmployeeDataProps } from "@/store/resource_management/team";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { getTableCellClass } from "../utils/helper";

type EmployeeResourceData = {
  combinedResourceData: any;
  allDates: string[];
};

export const Employee = ({ employeeData }: { employeeData: EmployeeDataProps }) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const dispatch = useDispatch();

  const employeeResourceData: EmployeeResourceData = useMemo(findCombineData, [
    employeeData,
    resourceTeamState.data.dates,
  ]);

  function findCombineData() {
    let allResourceAllocation: any[] = [];
    let allDates: string[] = [];
    const resourceData = employeeData.all_dates_data;

    for (let index = 0; index < resourceTeamState.data.dates.length; index++) {
      allDates = allDates.concat(resourceTeamState.data.dates[index].dates);
    }

    for (let index = 0; index < resourceData.length; index++) {
      allResourceAllocation = allResourceAllocation.concat(
        resourceData[index].employee_resource_allocation_for_given_date
      );
    }
    const combinedResourceData: any = {};

    for (let index = 0; index < allResourceAllocation.length; index++) {
      const resource = allResourceAllocation[index];

      if (!(resource.project in combinedResourceData)) {
        combinedResourceData[resource.project] = {
          project_name: resource.project_name,
          total_allocated_hours: 0,
          all_allocation: {},
        };
      }

      if (!(resource.date in combinedResourceData[resource.project].all_allocation)) {
        combinedResourceData[resource.project].all_allocation[resource.date] = {
          allocations: [],
          total_allocated_hours: 0,
          total_worked_hours_resource_allocation: 0,
        };
      }

      combinedResourceData[resource.project].total_allocated_hours += resource.hours_allocated_per_day;
      combinedResourceData[resource.project].all_allocation[resource.date].allocations.push(resource);
      combinedResourceData[resource.project].all_allocation[resource.date].total_allocated_hours +=
        resource.hours_allocated_per_day;
      combinedResourceData[resource.project].all_allocation[resource.date].total_worked_hours_resource_allocation +=
        resource.total_worked_hours_resource_allocation;
    }

    return {
      combinedResourceData: combinedResourceData,
      allDates: allDates,
    };
  }
  return (
    <Table>
      <TableBody className="[&_tr]:pr-0">
        {Object.keys(employeeResourceData["combinedResourceData"]).length == 0 &&
          Object.keys(employeeData.all_leave_data).length == 0 && <EmptyRow dates={employeeResourceData.allDates} />}
        {Object.entries(employeeResourceData["combinedResourceData"]).length > 0 &&
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //   @ts-ignore
          Object.entries(employeeResourceData["combinedResourceData"]).map(([item, itemData]: [string, any]) => {
            return (
              <TableRow key={item} className="flex items-center w-full border-0">
                <TableCell className="w-[24rem] overflow-hidden pl-12">
                  <Typography
                    variant="p"
                    className="flex gap-x-2 items-center font-normal hover:underline w-full cursor-pointer"
                    onClick={() => {
                      window.location.href = `${window.location.origin}/app/project/${item}`;
                    }}
                  >
                    {item} - {itemData.project_name}
                  </Typography>
                  {/* <Typography variant="small" className="text-slate-500 truncate">
                      {taskData.project_name}
                    </Typography> */}
                </TableCell>
                {employeeResourceData.allDates.map((date: string, index: number) => {
                  const total_allocated_hours = itemData.all_allocation[date]
                    ? itemData.all_allocation[date].total_allocated_hours
                    : 0;

                  const total_worked_hours = itemData.all_allocation[date]
                    ? itemData.all_allocation[date].total_worked_hours_resource_allocation
                    : 0;
                  return (
                    <TableCell className={getTableCellClass(index)} key={date}>
                      {total_allocated_hours == 0 && total_worked_hours == 0
                        ? "-"
                        : resourceTeamState.tableView.view == "planned-vs-capacity"
                        ? total_allocated_hours
                        : `${total_worked_hours} / ${total_allocated_hours}`}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}

        {Object.keys(employeeData.all_leave_data).length != 0 && (
          <TimeOffRow dates={employeeResourceData.allDates} employeeData={employeeData} />
        )}
      </TableBody>
    </Table>
  );
};

const TimeOffRow = ({ dates, employeeData }: { dates: string[]; employeeData: EmployeeDataProps }) => {
  return (
    <TableRow className="flex items-center w-full border-0">
      <TableCell className="w-[24rem] overflow-hidden pl-12">
        <Typography variant="p" className="flex gap-x-2 items-center font-normal hover:underline w-full">
          Time Off
        </Typography>
        {/* <Typography variant="small" className="text-slate-500 truncate">
        {taskData.project_name}
      </Typography> */}
      </TableCell>
      {dates.map((date: string, index: number) => {
        return (
          <TableCell className={getTableCellClass(index)} key={date}>
            {employeeData.all_leave_data[date] ? employeeData.all_leave_data[date] : "-"}
          </TableCell>
        );
      })}
    </TableRow>
  );
};

const EmptyRow = ({ dates }: { dates: string[] }) => {
  return (
    <TableRow className="flex items-center w-full border-0">
      <TableCell className="w-[24rem] overflow-hidden pl-12">
        <Typography variant="p" className="flex gap-x-2 items-center font-normal hover:underline w-full">
          {" "}
        </Typography>
        {/* <Typography variant="small" className="text-slate-500 truncate">
        {taskData.project_name}
      </Typography> */}
      </TableCell>
      {dates.map((date: string, index: number) => {
        return (
          <TableCell className={getTableCellClass(index)} key={date}>
            -
          </TableCell>
        );
      })}
    </TableRow>
  );
};
