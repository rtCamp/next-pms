import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Spinner } from "@/app/components/spinner";
import { Table, TableBody, TableCell, TableRow } from "@/app/components/ui/table";
import { Typography } from "@/app/components/typography";
import { cn, floatToTime, getDateFromDateAndTime, preProcessLink } from "@/lib/utils";
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
          {leaves.length > 0 && <LeaveRow dates={timesheetData.dates} holidays={holidays} leaves={leaves} />}
          {Object.keys(timesheetData.tasks).length == 0 && <EmptyRow dates={timesheetData.dates} holidays={holidays} />}
          {Object.keys(timesheetData.tasks).length > 0 &&
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //   @ts-ignore
            Object.entries(timesheetData.tasks).map(([task, taskData]: [string, TaskDataProps]) => {
              let totalHours = 0;
              return (
                <TableRow key={task} className="border-b border-slate-200 flex w-full">
                  <TableCell className="max-w-md w-full">
                    <Typography variant="p" className="text-slate-800">
                      {task}
                    </Typography>
                    <Typography variant="small" className="text-slate-500">
                      {taskData.project_name}
                    </Typography>
                  </TableCell>
                  {timesheetData.dates.map((date: string) => {
                    const data = taskData.data.find(
                      (data: TaskDataItemProps) => getDateFromDateAndTime(data.from_time) === date
                    );
                    if (data && data.hours) {
                      totalHours += data.hours;
                    }
                    const isHoliday = holidays.includes(date);
                    return <Cell date={date} data={data} isHoliday={isHoliday} />;
                  })}
                  <TableCell
                    className={cn(
                      "max-w-24 w-full flex justify-between items-center",
                      !taskData.is_billable && "justify-end"
                    )}
                  >
                    {taskData.is_billable == true && <CircleDollarSign className="stroke-success w-4 h-4" />}
                    <Typography variant="p" className="text-slate-800 font-medium">
                      {floatToTime(totalHours)}
                    </Typography>
                  </TableCell>
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
      {dates.map((date: string) => {
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
        return <Cell date={date} data={value} isHoliday={isHoliday} onCellClick={onCellClick} />;
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
  data: TaskDataItemProps | undefined;
  isHoliday: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (val) => void;
  disabled?: boolean;
}) => {
  const isDisabled = disabled || data?.docstatus === 1;
  const handleClick = () => {
    if (isDisabled || !data) return;
    const value = {
      date: date,
      hours: data?.hours ?? "",
      description: data?.description ?? "",
      isUpdate: data?.hours > 0 ? true : false,
      name: data?.name ?? "",
      parent: data?.parent ?? "",
      task: data?.task ?? "",
    };

    onCellClick && onCellClick(value);
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
          <span className="flex flex-col items-center ">
            <Typography
              variant="p"
              className={cn(
                "text-slate-600",
                isHoliday || (isDisabled && "text-slate-400"),
                !data?.hours && "group-hover:hidden"
              )}
            >
              {data?.hours ? floatToTime(data?.hours || 0) : "-"}
            </Typography>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <PencilLine
              className={cn("text-center hidden", data?.hours > 0 && !isDisabled && "group-hover:block")}
              size={16}
            />
            <CirclePlus
              className={cn("text-center hidden", !data?.hours && !isDisabled && "group-hover:block ")}
              size={16}
            />
          </span>
        </HoverCardTrigger>
        {data?.description && (
          <HoverCardContent className="whitespace-pre text-left w-full max-w-96 max-h-52 overflow-auto text-wrap">
            <p dangerouslySetInnerHTML={{ __html: preProcessLink(data?.description) }}></p>
          </HoverCardContent>
        )}
      </TableCell>
    </HoverCard>
  );
};

const LeaveRow = ({ leaves, dates, holidays }: { leaves: Array<LeaveProps>; dates: string[]; holidays: string[] }) => {
  let total_hours = 0;
  const leaveData = dates.map((date: string) => {
    if (holidays.includes(date)) {
      return { date, isHoliday: true };
    }
    const data = leaves.find((data: LeaveProps) => {
      return date >= data.from_date && date <= data.to_date;
    });
    const hour = data?.half_day && data?.half_day_date == date ? 4 : 8;
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
