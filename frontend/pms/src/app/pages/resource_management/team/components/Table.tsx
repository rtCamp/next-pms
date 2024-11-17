import { useSelector } from "react-redux";
import { HoverCard, HoverCardTrigger } from "@/app/components/ui/hover-card";
import { RootState } from "@/store";
import { DateProps, EmployeeSingleDayProps, EmployeeDataProps } from "@/store/resource_management/team";
import { prettyDate, cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ResourceExpandView } from "./ExpandView";
import { useMemo } from "react";
import { getTableCellClass, getTableCellRow } from "../utils/helper";

const ResourceTeamTable = () => {
  return (
    <Table className="lg:[&_tr]:pr-3 relative">
      <ResourceTeamTableHeader />
      <ResourceTeamTableBody />
    </Table>
  );
};

const ResourceTeamTableBody = () => {
  const data = useSelector((state: RootState) => state.resource_team.data.data);

  return (
    <TableBody>
      {data.length == 0 && (
        <TableRow>
          <TableCell colSpan={15} className="h-24 text-center">
            No results
          </TableCell>
        </TableRow>
      )}
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      {data.map((employeeData: EmployeeDataProps) => {
        return <ResourceTeamTableRow employeeData={employeeData} key={employeeData.name} />;
      })}
    </TableBody>
  );
};

const ResourceTeamTableHeader = () => {
  const dates = useSelector((state: RootState) => state.resource_team.data.dates);

  return (
    <TableHeader className="border-t-0 sticky top-0 z-10">
      <TableRow className="flex items-center  w-[75rem]">
        <TableHead className="w-[24rem] flex items-center">Members</TableHead>
        <div className="flex flex-col w-[50rem]">
          <div className="flex items-center">
            <Typography className="w-full text-center truncate cursor-pointer text-base border-r border-gray-300 my-1">
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              {dates.length > 0 && dates[0].key}
            </Typography>
            <Typography className="w-full text-center truncate cursor-pointer text-base my-1">
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              {dates.length > 0 && dates[1].key}
            </Typography>
          </div>
          <div className="flex items-center">
            {dates.map((item: DateProps, weekIndex: number) => {
              return item?.dates?.map((date, index) => {
                const { date: dateStr, day } = prettyDate(date);
                return (
                  <TableHead
                    key={date}
                    className={cn(
                      getTableCellClass(index, weekIndex),
                      "flex flex-col max-w-20 w-full items-center justify-center"
                    )}
                  >
                    <Typography variant="p" className="text-slate-600">
                      {day}
                    </Typography>
                    <Typography variant="small" className="text-slate-500 max-lg:text-[0.65rem]">
                      {dateStr}
                    </Typography>
                  </TableHead>
                );
              });
            })}
          </div>
        </div>
      </TableRow>
    </TableHeader>
  );
};

const ResourceTeamTableRow = ({ employeeData }: { employeeData: EmployeeDataProps }) => {
  return (
    <TableRow key={employeeData.name} className={getTableCellRow()}>
      <Accordion type="multiple" key={employeeData.name} className="w-full">
        <AccordionItem value={employeeData.name} className="border-b-0">
          <AccordionTrigger className="hover:no-underline py-0">
            <span className="w-full flex ">
              <TableCell className="w-[24rem] overflow-hidden">
                <span className="flex gap-x-2 items-center font-normal hover:underline w-full">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={decodeURIComponent(employeeData.image)} />
                    <AvatarFallback>{employeeData.employee_name}</AvatarFallback>
                  </Avatar>
                  <Typography variant="p" className="text-left text-ellipsis whitespace-nowrap overflow-hidden ">
                    {employeeData.employee_name}
                  </Typography>
                </span>
              </TableCell>
              {employeeData.all_dates_data.map((employeeSingleDay: EmployeeSingleDayProps, index: number) => {
                return (
                  <ResourceTeamTableCell
                    key={`${employeeSingleDay.total_allocated_hours}-id-${Math.random()}`}
                    employeeSingleDay={employeeSingleDay}
                    allWeekData={employeeData.all_week_data}
                    rowCount={index}
                    midIndex={index <= 4 ? 0 : 1}
                  />
                );
              })}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <ResourceExpandView employeeData={employeeData} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </TableRow>
  );
};

const ResourceTeamTableCell = ({
  employeeSingleDay,
  allWeekData,
  rowCount,
  midIndex,
}: {
  employeeSingleDay: EmployeeSingleDayProps;
  allWeekData: any;
  rowCount: number;
  midIndex: number;
}) => {
  const tableView = useSelector((state: RootState) => state.resource_team.tableView);

  const allocationPercentage = useMemo(() => {
    if (tableView.combineWeekHours) {
      if (allWeekData[midIndex].total_working_hours == 0) {
        return -1;
      }
      return 100 - (allWeekData[midIndex].total_allocated_hours / allWeekData[midIndex].total_working_hours) * 100;
    }

    if (employeeSingleDay.total_working_hours == 0) {
      return -1;
    }

    return 100 - (employeeSingleDay.total_allocated_hours / employeeSingleDay.total_working_hours) * 100;
  }, [
    allWeekData,
    employeeSingleDay.total_allocated_hours,
    employeeSingleDay.total_working_hours,
    midIndex,
    tableView.combineWeekHours,
  ]);

  const cellBackGroundColor = useMemo(() => {
    if (allocationPercentage === -1) {
      return "bg-gray-100";
    }
    if (allocationPercentage == 100) {
      return "bg-destructive/20";
    }

    if (allocationPercentage <= 10) {
      return "bg-success/20";
    }

    if (allocationPercentage <= 20) {
      return "bg-customYellow";
    }

    return "bg-destructive/10";
  }, [allocationPercentage]);

  return (
    <HoverCard openDelay={1000}>
      <TableCell className={cn(getTableCellClass(rowCount), cellBackGroundColor)}>
        <HoverCardTrigger>
          <Typography className={cn("text-gray-800 text-xs")} variant="p">
            {tableView.combineWeekHours &&
              (rowCount == 2 || rowCount == 7) &&
              (tableView.view == "planned-vs-capacity"
                ? `${allWeekData[midIndex].total_allocated_hours} / ${allWeekData[midIndex].total_working_hours}`
                : `${allWeekData[midIndex].total_worked_hours} / ${allWeekData[midIndex].total_allocated_hours}`)}

            {!tableView.combineWeekHours &&
              (employeeSingleDay.is_on_leave
                ? employeeSingleDay.total_leave_hours
                : employeeSingleDay.total_allocated_hours == 0
                ? "-"
                : employeeSingleDay.total_allocated_hours)}
          </Typography>
        </HoverCardTrigger>
        {/* {data.note && (
      <HoverCardContent className="text-sm font-normal text-left whitespace-pre text-wrap w-full max-w-96 max-h-52 overflow-auto">
        <p dangerouslySetInnerHTML={{ __html: preProcessLink(data.note) }}></p>
      </HoverCardContent>
    )} */}
      </TableCell>
    </HoverCard>
  );
};

export { ResourceTeamTable };
