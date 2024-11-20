import { Table, TableBody, TableCell, TableRow } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { EmployeeDataProps } from "@/store/resource_management/team";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { getTableCellClass } from "../../utils/helper";
import { HoverCardContent, HoverCardTrigger, HoverCard } from "@/app/components/ui/hover-card";
import { ResourceAllocationList } from "../../components/Card";
import { CombinedResourceObjectProps, CombinedResourceDataProps, groupAllocations } from "../utils/group";
import { EmptyRow } from "../../components/Empty";

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
                    return (
                      <ExpandViewCell
                        key={date + "-" + index}
                        index={index}
                        allocationsData={itemData.all_allocation[date]}
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

const ExpandViewCell = ({ allocationsData, index }: { allocationsData: any; index: number }) => {
  const resourceTeamState = useSelector((state: RootState) => state.resource_team);

  const total_allocated_hours = allocationsData ? allocationsData.total_allocated_hours : 0;

  const total_worked_hours = allocationsData ? allocationsData.total_worked_hours_resource_allocation : 0;

  if (total_allocated_hours == 0 && total_allocated_hours == 0) {
    return <TableCell className={getTableCellClass(index)}>{"-"}</TableCell>;
  }

  return (
    <HoverCard key={index} openDelay={1}>
      <HoverCardTrigger asChild className="w-full h-full cursor-pointer text-center hover:bg-gray-200">
        <TableCell className={getTableCellClass(index)}>
          {resourceTeamState.tableView.view == "planned-vs-capacity" ||
          resourceTeamState.tableView.view == "customer-view"
            ? total_allocated_hours
            : `${total_worked_hours} / ${total_allocated_hours}`}
        </TableCell>
      </HoverCardTrigger>
      <HoverCardContent>
        <ResourceAllocationList resourceAllocationList={allocationsData.allocations} />
      </HoverCardContent>
    </HoverCard>
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
