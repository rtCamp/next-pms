import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { DateProps, EmployeeResourceProps, EmployeeDataProps } from "@/store/resource_management/team";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { ResourceExpandView } from "./ExpandView";
import { useEffect, useMemo, useRef, useState } from "react";
import { getTableCellClass } from "../../utils/helper";
import { CustomerAllocationList } from "./CustomerAllocationList";
import { ResourceAllocationObjectProps } from "@/types/resource_management";
import ResourceTeamTableHeader from "../../components/TableHeader";
import { EmptyTableBody, EmptyTableCell } from "../../components/Empty";
import { ResourceTableRow } from "../../components/TableRow";
import { setResourceFormData } from "@/store/resource_management/allocation";
import { HoverCard, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { ResourceAllocationList } from "../../components/Card";
import { HoverCardContent } from "@/app/components/ui/hover-card";

const ResourceTeamTable = () => {
  const dates: DateProps[] = useSelector((state: RootState) => state.resource_team.data.dates);

  return (
    <Table className="lg:[&_tr]:pr-3 relative">
      <ResourceTeamTableHeader dates={dates} title="Members" />
      <ResourceTeamTableBody />
    </Table>
  );
};

const ResourceTeamTableBody = () => {
  const data = useSelector((state: RootState) => state.resource_team.data.data);

  if (data.length == 0) {
    return <EmptyTableBody />;
  }

  return (
    <TableBody>
      {data.map((employeeData: EmployeeDataProps) => {
        return (
          <ResourceTableRow
            name={employeeData.name}
            avatar={employeeData.image}
            avatar_abbr={employeeData.employee_name}
            avatar_name={employeeData.employee_name}
            RowComponent={() => {
              return (
                <>
                  {employeeData.all_dates_data.map((employeeSingleDay: EmployeeResourceProps, index: number) => {
                    return (
                      <ResourceTeamTableCell
                        key={`${employeeSingleDay.total_allocated_hours}-id-${Math.random()}`}
                        employeeSingleDay={employeeSingleDay}
                        allWeekData={employeeData.all_week_data}
                        employee={employeeData.name}
                        rowCount={index}
                        max_allocation_count_for_single_date={employeeData.max_allocation_count_for_single_date}
                        midIndex={index <= 4 ? 0 : 1}
                        employeeAllocations={employeeData.employee_allocations}
                      />
                    );
                  })}
                </>
              );
            }}
            RowExpandView={() => {
              return <ResourceExpandView employeeData={employeeData} />;
            }}
          />
        );
      })}
    </TableBody>
  );
};

const ResourceTeamTableCell = ({
  employeeSingleDay,
  allWeekData,
  rowCount,
  employee,
  max_allocation_count_for_single_date,
  midIndex,
  employeeAllocations,
}: {
  employeeSingleDay: EmployeeResourceProps;
  allWeekData: any;
  rowCount: number;
  employee: string;
  max_allocation_count_for_single_date: number;
  midIndex: number;
  employeeAllocations: ResourceAllocationObjectProps;
}) => {
  const tableView = useSelector((state: RootState) => state.resource_team.tableView);

  const heightFactor: number = 40;
  const height: number =
    max_allocation_count_for_single_date == 0 ? 0 : max_allocation_count_for_single_date * heightFactor;
  const dispatch = useDispatch();

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

    if (allocationPercentage >= 100 || allocationPercentage < 0) {
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
          background:
            allocationPercentage < 50
              ? allocationPercentage == 0
                ? "rgb(214, 236, 214)"
                : allocationPercentage <= 25
                ? `rgb(214, 236, 214, ${(100 - allocationPercentage / 100) * 3}`
                : `rgb(214, 236, 214, ${(100 - allocationPercentage / 100) * 2}`
              : `rgb(255, 202, 202, ${Math.pow(allocationPercentage / 100, 2) * 1.15})`,
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

  if (!tableView.combineWeekHours && !employeeSingleDay.is_on_leave && employeeSingleDay.total_allocated_hours == 0) {
    return (
      <EmptyTableCell
        cellClassName={cn(getTableCellClass(rowCount), cellBackGroundColor)}
        textClassName="h-6"
        onCellClick={() => {
          dispatch(
            setResourceFormData({
              isShowDialog: true,
              employee: employee,
              allocation_start_date: employeeSingleDay.date,
              allocation_end_date: employeeSingleDay.date,
              is_billable: false,
              total_allocated_hours: 0,
              hours_allocated_per_day: 0,
              note: "",
              project: "",
              project_name: "",
              customer: "",
              customer_name: "",
              isNeedToEdit: false,
              name: ""
            })
          );
        }}
      />
    );
  }

  if (!tableView.combineWeekHours && employeeSingleDay.is_on_leave) {
    return (
      <TableCell ref={cellRef} className={cn(getTableCellClass(rowCount), cellBackGroundColor)}>
        <Typography className={cn("text-gray-800 text-xs h-6 flex items-center")} variant="p">
          {employeeSingleDay.total_leave_hours}
        </Typography>
      </TableCell>
    );
  }

  if (tableView.combineWeekHours) {
    return (
      <TableCell ref={cellRef} className={cn(getTableCellClass(rowCount), cellBackGroundColor)}>
        <Typography className={cn("text-gray-800 text-xs h-6 flex items-center")} variant="p">
          {(rowCount == 2 || rowCount == 7) &&
            (tableView.view == "planned-vs-capacity"
              ? `${allWeekData[midIndex].total_allocated_hours} / ${allWeekData[midIndex].total_working_hours}`
              : `${allWeekData[midIndex].total_worked_hours} / ${allWeekData[midIndex].total_allocated_hours}`)}
        </Typography>
      </TableCell>
    );
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild className="w-full h-full cursor-pointer text-center hover:bg-gray-200">
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
      </HoverCardTrigger>
      <HoverCardContent>
        <ResourceAllocationList
          resourceAllocationList={employeeSingleDay.employee_resource_allocation_for_given_date}
          employeeAllocations={employeeAllocations}
        />
      </HoverCardContent>
    </HoverCard>
  );
};

export { ResourceTeamTable };
