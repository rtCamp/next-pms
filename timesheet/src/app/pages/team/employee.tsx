import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Spinner } from "@/app/components/spinner";
import { Table, TableBody, TableCell, TableRow } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { cn, expectatedHours, floatToTime, getDateFromDateAndTime, preProcessLink } from "@/lib/utils";
import { PencilLine, CirclePlus, CircleDollarSign } from "lucide-react";
import { TaskDataProps, TaskDataItemProps, LeaveProps } from "@/types/timesheet";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
interface EmployeeProps {
  employee: string;
}

export const Employee = ({ employee }: EmployeeProps) => {
  const teamState = useSelector((state: RootState) => state.team);
  const { data, isLoading } = useFrappeGetCall("timesheet_enhancer.api.team.get_timesheet_for_employee", {
    employee: employee,
    date: teamState.weekDate,
  });
  if (isLoading) {
    return <Spinner />;
  }

  const timesheetData = data?.message.data[Object.keys(data?.message.data)[0]];
  const holidays = data?.message.holidays;
  const leaves = data?.message.leaves;
  return (
    <div>
      <Table>
        <TableBody>
          {leaves.length > 0 && (
            <LeaveRow
              dates={timesheetData.dates}
              holidays={holidays}
              leaves={leaves}
              expectedHours={expectatedHours(timesheetData.working_hour, timesheetData.working_frequency)}
            />
          )}
          {Object.keys(timesheetData.tasks).length == 0 && <EmptyRow dates={timesheetData.dates} holidays={holidays} />}
          {Object.keys(timesheetData.tasks).length > 0 &&
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //   @ts-ignore
            Object.entries(timesheetData.tasks).map(([task, taskData]: [string, TaskDataProps]) => {
              let totalHours = 0;
              return (
                <TableRow key={task} className="border-b border-slate-200 flex w-full">
                  <TableCell className="w-full min-w-24 max-w-md overflow-hidden">
                    <Typography variant="p" className="text-slate-800  truncate w-full">
                      {task}
                    </Typography>
                    <Typography variant="small" className="text-slate-500 truncate">
                      {taskData.project_name}
                    </Typography>
                  </TableCell>
                  {timesheetData.dates.map((date: string, key: number) => {
                    const data = taskData.data.filter(
                      (data: TaskDataItemProps) => getDateFromDateAndTime(data.from_time) === date
                    );
                    data.forEach((item: TaskDataItemProps) => {
                      totalHours += item.hours;
                    });

                    const isHoliday = holidays.includes(date);
                    return <Cell key={key} date={date} data={data} isHoliday={isHoliday} disabled />;
                  })}
                  <TableCell
                    className={cn(
                      "max-w-24 w-full  flex justify-between items-center",
                      !taskData.is_billable && "justify-end"
                    )}
                  >
                    {taskData.is_billable == true && <CircleDollarSign className="stroke-success w-4 h-4" />}
                    <Typography variant="p" className="text-slate-800 font-medium">
                      {floatToTime(totalHours)}
                    </Typography>
                  </TableCell>
                  {/* added empty TableCell to make it even when screen get's smaller */}
                  <TableCell className={cn("flex max-w-20 w-full justify-center items-center")}></TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
};

export const EmptyRow = ({
  dates,
  holidays,
  onCellClick,
}: {
  dates: string[];
  holidays: string[];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
}) => {
  return (
    <TableRow className="flex">
      <TableCell className="w-full max-w-md">
        <Typography variant="p" className="text-destructive">
          Add Task
        </Typography>
      </TableCell>
      {dates.map((date: string, key) => {
        const isHoliday = holidays.includes(date);
        const value = {
          date,
          hours: "",
          description: "",
          isUpdate: false,
          name: "",
          parent: "",
          task: "",
        };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //   @ts-ignore
        return <Cell key={key} date={date} data={value} isHoliday={isHoliday} onCellClick={onCellClick} disabled />;
      })}
      <TableCell className="w-full max-w-24 text-left"></TableCell>
    </TableRow>
  );
};

const Cell = ({
  date,
  data,
  isHoliday,
  onCellClick,
  disabled,
}: {
  date: string;
  data: TaskDataItemProps[] | undefined;
  isHoliday: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (val) => void;
  disabled?: boolean;
}) => {
  let hours = 0;
  let description = "";
  if (data) {
    hours = data.reduce((sum, item) => sum + (item.hours || 0), 0);
    description = data.reduce((desc, item) => desc + (item.description ? item.description + "\n" : ""), "").trim();
  }
  const isDisabled = disabled || data?.[0]?.docstatus === 1;
  const handleClick = () => {
    if (isDisabled) return;
    if (hours === 0) {
      const value = {
        date: date,
        hours: 0,
        description: "",
        isUpdate: false,
        name: "",
        parent: "",
        task: data?.[0]?.task ?? "",
      };
      onCellClick && onCellClick(value);
      return;
    }
  };

  return (
    <HoverCard>
      <TableCell
        key={date}
        onClick={handleClick}
        className={cn(
          "max-w-20 w-full group text-center hover:bg-slate-100 hover:text-center hover:cursor-pointer",
          isDisabled && "cursor-default"
        )}
      >
        <HoverCardTrigger className={cn("h-full", isDisabled && "cursor-default")} asChild>
          <span className="flex flex-col items-center justify-center ">
            <Typography
              variant="p"
              className={cn(
                "text-slate-600",
                isHoliday || (isDisabled && "text-slate-400"),
                !hours && "group-hover:hidden"
              )}
            >
              {hours > 0 ? floatToTime(hours || 0) : "-"}
            </Typography>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <PencilLine
              className={cn("text-center hidden", hours > 0 && !isDisabled && "group-hover:block")}
              size={16}
            />
            <CirclePlus className={cn("text-center hidden", !hours && !isDisabled && "group-hover:block ")} size={16} />
          </span>
        </HoverCardTrigger>
        {description && (
          <HoverCardContent className="whitespace-pre text-left w-full max-w-96 max-h-52 overflow-auto text-wrap">
            <p dangerouslySetInnerHTML={{ __html: preProcessLink(description) }}></p>
          </HoverCardContent>
        )}
      </TableCell>
    </HoverCard>
  );
};

const LeaveRow = ({
  leaves,
  dates,
  holidays,
  expectedHours,
}: {
  leaves: Array<LeaveProps>;
  dates: string[];
  holidays: string[];
  expectedHours: number;
}) => {
  let total_hours = 0;
  const leaveData = dates.map((date: string) => {
    if (holidays.includes(date)) {
      return { date, isHoliday: true };
    }
    const data = leaves.find((data: LeaveProps) => {
      return date >= data.from_date && date <= data.to_date;
    });
    const hour = data?.half_day && data?.half_day_date == date ? expectedHours / 2 : expectedHours;
    if (data) {
      total_hours += hour;
    }
    return { date, data, hour, isHoliday: false };
  });

  // Check if there are any leaves
  const hasLeaves = leaveData.some(({ data, isHoliday }) => data || isHoliday);

  if (!hasLeaves) {
    return null;
  }

  return (
    <TableRow className="flex">
      <TableCell className="w-full min-w-md text-left max-w-md">
        <Typography variant="p" className="text-slate-800 w-full">
          Time Off
        </Typography>
      </TableCell>
      {leaveData.map(({ date, data, hour, isHoliday }) => (
        <TableCell key={date} className="max-w-20 min-w-20 w-full text-center">
          <Typography variant="p" className={isHoliday ? "text-white" : "text-warning"}>
            {data ? floatToTime(hour) : ""}
          </Typography>
        </TableCell>
      ))}
      <TableCell className="max-w-24 w-full items-center justify-end flex">
        <Typography variant="p" className="text-slate-800 font-medium text-right">
          {floatToTime(total_hours)}
        </Typography>
      </TableCell>
    </TableRow>
  );
};
