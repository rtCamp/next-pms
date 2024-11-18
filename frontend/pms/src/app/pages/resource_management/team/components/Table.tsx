import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { DateProps, EmployeeResourceProps, EmployeeDataProps } from "@/store/resource_management/team";
import { prettyDate, cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ResourceExpandView } from "./ExpandView";
import { useEffect, useMemo, useRef, useState } from "react";
import { getTableCellClass, getTableCellRow } from "../utils/helper";
import { CustomerAllocationList } from "./CustomerAllocationList";
import { ResourceAllocationObjectProps } from "@/types/resource_management";

const ResourceTeamTable = () => {
  return (
    <Table className="lg:[&_tr]:pr-3 relative">
      <ResourceTeamTableHeader />
      <ResourceTeamTableBody />
    </Table>
  );
};

const ResourceTeamTableHeader = () => {
  const dates = useSelector((state: RootState) => state.resource_team.data.dates);

  return (
    <TableHeader className="border-t-0 sticky top-0 z-30">
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

const ResourceTeamTableRow = ({ employeeData }: { employeeData: EmployeeDataProps }) => {
  return (
    <Accordion type="multiple" key={employeeData.name} className="w-full">
      <AccordionItem value={employeeData.name} className="border-b-0">
        <AccordionTrigger className="hover:no-underline py-0">
          <TableRow key={employeeData.name} className={cn(getTableCellRow(), "relative overflow-hidden")}>
            <TableCell className={cn("w-[24rem]", "overflow-hidden")}>
              <span className="flex gap-x-2 items-center font-normal hover:underline w-full">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={decodeURIComponent(employeeData.image)} />
                  <AvatarFallback>{employeeData.employee_name}</AvatarFallback>
                </Avatar>
                <Typography variant="p" className="text-left text-ellipsis whitespace-nowrap overflow-hidden ">
                  {employeeData.employee_name} - {employeeData.name}
                </Typography>
              </span>
            </TableCell>

            {employeeData.all_dates_data.map((employeeSingleDay: EmployeeResourceProps, index: number) => {
              return (
                <ResourceTeamTableCell
                  key={`${employeeSingleDay.total_allocated_hours}-id-${Math.random()}`}
                  employeeSingleDay={employeeSingleDay}
                  allWeekData={employeeData.all_week_data}
                  rowCount={index}
                  max_allocation_count_for_single_date={employeeData.max_allocation_count_for_single_date}
                  midIndex={index <= 4 ? 0 : 1}
                  employeeAllocations={employeeData.employee_allocations}
                />
              );
            })}
          </TableRow>
          {/* </span> */}
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          <ResourceExpandView employeeData={employeeData} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const ResourceTeamTableCell = ({
  employeeSingleDay,
  allWeekData,
  rowCount,
  max_allocation_count_for_single_date,
  midIndex,
  employeeAllocations,
}: {
  employeeSingleDay: EmployeeResourceProps;
  allWeekData: any;
  rowCount: number;
  max_allocation_count_for_single_date: number;
  midIndex: number;
  employeeAllocations: ResourceAllocationObjectProps;
}) => {
  const tableView = useSelector((state: RootState) => state.resource_team.tableView);

  const heightFactor: number = 40;
  const height: number =
    max_allocation_count_for_single_date == 0 ? 0 : max_allocation_count_for_single_date * heightFactor;

  let allocationPercentage = useMemo(() => {
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
      return "bg-gray-200";
    }

    if (allocationPercentage == 100) {
      return "bg-destructive/30";
    }

    if (allocationPercentage <= 10) {
      return "bg-success/20";
    }

    if (allocationPercentage <= 20) {
      return "bg-customYellow";
    }

    return "bg-destructive/10";
  }, [allocationPercentage]);

  const cellRef = useRef(null);

  const [cellWidth, setWidth] = useState(0);
  const [cellHeight, setHeight] = useState(0);

  useEffect(() => {
    if (!cellRef.current) return;

    const { width, height } = (cellRef.current as HTMLElement).getBoundingClientRect();

    setWidth(width);
    setHeight(height);
  }, []);

  // allocationPercentage = Math.random() * 100;

  if (tableView.view == "customer-view") {
    if (allocationPercentage == -1) {
      return (
        <TableCell
          ref={cellRef}
          className={cn(getTableCellClass(rowCount), allocationPercentage == -1 && cellBackGroundColor, "relative")}
          style={{
            height: height ? `${height}px` : "auto",
          }}
        >
          {rowCount == 0 && (
            <CustomerAllocationList
              cellWidth={cellWidth}
              cellHeight={cellHeight}
              employeeAllocations={employeeAllocations}
              heightFactor={heightFactor}
            />
          )}
          <Typography
            className={cn("text-gray-800 text-xs h-6 flex items-center")}
            variant="p"
            children={undefined}
          ></Typography>
        </TableCell>
      );
    }

    return (
      <TableCell
        ref={cellRef}
        className={cn(
          getTableCellClass(rowCount),
          allocationPercentage == -1 && cellBackGroundColor,
          height && `h-[${height}rem]`,
          "relative"
        )}
        style={{
          // background:
          //   allocationPercentage == 0
          //     ? ""
          //     : `rgb(255, 202, 202, ${Math.min(Math.pow(allocationPercentage / 100, 3), 1)})`,
          // background:  allocationPercentage==0?'':`rgb(255, 202, 202, ${Math.pow(allocationPercentage / 100, 2)})`,
          background:
            allocationPercentage < 50
              ? allocationPercentage == 0
                ? "rgb(214, 236, 214)"
                : allocationPercentage <= 25
                ? `rgb(214, 236, 214, ${(100 - allocationPercentage / 100) * 3}`
                : `rgb(214, 236, 214, ${(100 - allocationPercentage / 100) * 2}`
              : `rgb(255, 202, 202, ${Math.pow(allocationPercentage / 100, 2) * 1.15})`,
          // background:
          //   allocationPercentage === 0
          //     ? "rgb(214, 236, 214)"
          //     : allocationPercentage < 50
          //     ? `rgba(214, 236, 214, ${Math.max(0.2, 1 - allocationPercentage / 50)})`
          //     : `rgba(255, 202, 202, ${Math.max(0.2, (allocationPercentage - 50) / 50)})`,
          // background:
          //   allocationPercentage === 0
          //     ? "rgb(214, 236, 214)"
          //     : allocationPercentage < 50
          //     ? `rgba(133, 207, 133, ${Math.max(0.2, 1 - Math.pow(allocationPercentage / 50, 2))})`
          //     : `rgba(255, 100, 100, ${Math.max(0.2, Math.pow((allocationPercentage - 50) / 50, 1.5))})`,
          // background:
          //   allocationPercentage === 0
          //     ? `rgba(255, 150, 150, 0.1)`
          //     : `rgba(255, 100, 100, ${Math.max(0.2, Math.pow(allocationPercentage / 100, 1.5))})`,
          height: height ? `${height}px` : "auto",
        }}
      >
        {rowCount == 0 && (
          <CustomerAllocationList
            cellHeight={cellHeight}
            cellWidth={cellWidth}
            employeeAllocations={employeeAllocations}
            heightFactor={heightFactor}
          />
        )}
        <Typography
          className={cn("text-gray-800 text-xs h-6 flex items-center")}
          variant="p"
          children={undefined}
        ></Typography>
      </TableCell>
    );
  }

  return (
    <TableCell ref={cellRef} className={cn(getTableCellClass(rowCount), cellBackGroundColor)}>
      <Typography className={cn("text-gray-800 text-xs h-6 flex items-center")} variant="p">
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
    </TableCell>
  );
};

export { ResourceTeamTable };
