import { Table, TableBody, TableCell, TableRow } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { getTableCellClass } from "../../utils/helper";
import { HoverCardContent, HoverCardTrigger, HoverCard } from "@/app/components/ui/hover-card";
import { ResourceAllocationList } from "../../components/Card";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

interface ResourceExpandViewProps {
  project: string;
  start_date: string;
  end_date: string;
}

export const ResourceExpandView = ({ project, start_date, end_date }: ResourceExpandViewProps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const { data, isLoading, isValidating, error } = useFrappeGetCall(
    "next_pms.resource_management.api.project.get_employees_resrouce_data_for_given_project",
    {
      project: project,
      start_date: start_date,
      end_date: end_date,
    },
    undefined,
    {
      revalidateIfStale: false,
    }
  );

  console.log(data);

  return (
    <Table>
      <TableBody className="[&_tr]:pr-0">
        {data &&
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //   @ts-ignore
          data.message.data.map((employeeData: any) => {
            return (
              <TableRow key={employeeData.name} className="flex items-center w-full border-0">
                <TableCell className="w-[24rem] overflow-hidden pl-12">
                  <span className="flex gap-x-2 items-center font-normal hover:underline w-full cursor-pointer">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={decodeURIComponent(employeeData.image)} />
                      <AvatarFallback>{employeeData.employee_name}</AvatarFallback>
                    </Avatar>
                    <Typography variant="p" className="text-left text-ellipsis whitespace-nowrap overflow-hidden ">
                      {employeeData.employee_name}
                    </Typography>
                  </span>
                </TableCell>
                {employeeData.all_dates_date.map((employeeDayData: any, index: number) => {
                  return (
                    <ExpandViewCell
                      key={employeeDayData.date + "-" + index}
                      index={index}
                      allocationsData={employeeDayData}
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

const ExpandViewCell = ({ allocationsData, index }: { allocationsData: any; index: number }) => {
  const tableView = useSelector((state: RootState) => state.resource_project.tableView);

  if (allocationsData.total_allocated_hours == 0 && allocationsData.total_worked_hours == 0) {
    return <TableCell className={getTableCellClass(index)}>{"-"}</TableCell>;
  }

  return (
    <TableCell className={getTableCellClass(index)}>
      {tableView.view == "planned"
        ? allocationsData.total_allocated_hours
        : `${allocationsData.total_worked_hours} / ${allocationsData.total_allocated_hours}`}
    </TableCell>
  );

  return (
    <HoverCard key={index} openDelay={1}>
      <HoverCardTrigger asChild className="w-full h-full cursor-pointer text-center hover:bg-gray-200">
        <TableCell className={getTableCellClass(index)}>
          {tableView.view == "planned"
            ? allocationsData.total_allocated_hours
            : `${allocationsData.total_worked_hours} / ${allocationsData.total_allocated_hours}`}
        </TableCell>
      </HoverCardTrigger>
      <HoverCardContent>
        <ResourceAllocationList resourceAllocationList={allocationsData.allocations} />
      </HoverCardContent>
    </HoverCard>
  );
};
