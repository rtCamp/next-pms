import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { cn, prettyDate, getDateFromDateAndTime, floatToTime, calculateWeeklyHour } from "@/lib/utils";
import { Typography } from "./typography";
import { useState } from "react";
import { CircleCheck, CirclePlus, CircleX, Clock3, PencilLine, CircleDollarSign } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { TaskDataProps, TaskProps, TaskDataItemProps, LeaveProps } from "@/types/timesheet";
import { WorkingFrequency } from "@/types";
import GenWrapper from "./GenWrapper";
interface TimesheetTableProps {
  dates: string[];
  holidays: string[];
  tasks: TaskProps;
  leaves: Array<LeaveProps>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
  hasHeading?: boolean;
  working_hour: number;
  disabled?: boolean;
  working_frequency: WorkingFrequency;
}

const TimesheetTable = ({
  dates,
  holidays,
  tasks,
  leaves,
  onCellClick,
  hasHeading = true,
  working_hour,
  working_frequency,
  disabled,
}: TimesheetTableProps) => {
  return (
    <GenWrapper>
      <Table className={`table-fixed`}>
        {hasHeading && (
          <TableHeader>
            <TableRow>
              <TableHead className="max-w-sm w-2/6">
                <Typography variant="p" className="text-base text-slate-600">
                  Tasks
                </Typography>
              </TableHead>
              {dates?.map((date: string) => {
                const { date: formattedDate, day } = prettyDate(date);
                const isHoliday = holidays.includes(date);
                return (
                  <TableHead key={date} className="max-w-20 text-center">
                    <Typography variant="p" className={cn("text-slate-600 font-medium", isHoliday && "text-slate-400")}>
                      {day}
                    </Typography>
                    <Typography variant="small" className={cn("text-slate-500", isHoliday && "text-slate-300")}>
                      {formattedDate}
                    </Typography>
                  </TableHead>
                );
              })}
              <TableHead className="max-w-24 w-1/12">
                <Typography variant="p" className="text-base text-slate-600 text-right">
                  Total
                </Typography>
              </TableHead>
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Object.keys(tasks).length > 0 && (
            <TotalHourRow
              dates={dates}
              leaves={leaves}
              tasks={tasks}
              holidays={holidays}
              working_frequency={working_frequency}
              working_hour={working_hour}
            />
          )}
          {leaves.length > 0 && <LeaveRow dates={dates} leaves={leaves} />}
          {Object.keys(tasks).length == 0 && (
            <EmptyRow dates={dates} holidays={holidays} onCellClick={onCellClick} disabled={disabled} />
          )}
          {Object.keys(tasks).length > 0 &&
            Object.entries(tasks).map(([task, taskData]: [string, TaskDataProps]) => {
              let totalHours = 0;
              return (
                <TableRow key={task} className="border-b border-slate-200">
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger className={``} asChild>
                      <TableCell className={`cursor-pointer`}>
                        <Typography variant="p" className="text-slate-800 truncate overflow-hidden ">
                          {task}
                        </Typography>
                        <TooltipContent>{task}</TooltipContent>

                        <Typography
                          variant="small"
                          className="text-slate-500 whitespace-nowrap text-ellipsis overflow-hidden "
                        >
                          {taskData.project_name}
                        </Typography>
                      </TableCell>
                    </TooltipTrigger>
                  </Tooltip>
                  {dates.map((date: string) => {
                    let data = taskData.data.find(
                      (data: TaskDataItemProps) => getDateFromDateAndTime(data.from_time) === date
                    );
                    if (data && data.hours) {
                      totalHours += data.hours;
                    }
                    if (!data) {
                      data = {
                        hours: 0,
                        description: "",
                        name: "",
                        parent: "",
                        task: taskData.name,
                        from_time: date,
                        docstatus: 0,
                      };
                    }
                    const isHoliday = holidays.includes(date);
                    return (
                      <Cell
                        key={date}
                        date={date}
                        data={data}
                        isHoliday={isHoliday}
                        onCellClick={onCellClick}
                        disabled={disabled}
                      />
                    );
                  })}
                  <TableCell className="text-center">
                    <Typography
                      variant="p"
                      className={cn(
                        "text-slate-800 font-medium text-right flex justify-between items-center",
                        !taskData.is_billable && "justify-end"
                      )}
                    >
                      {taskData.is_billable == true && <CircleDollarSign className="stroke-success w-4 h-4" />}
                      {floatToTime(totalHours)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </GenWrapper>
  );
};

const LeaveRow = ({ leaves, dates }: { leaves: Array<LeaveProps>; dates: string[] }) => {
  let total_hours = 0;
  return (
    <TableRow>
      <TableCell>
        <Typography variant="p" className="text-slate-800">
          Time Off
        </Typography>
      </TableCell>
      {dates.map((date: string) => {
        const data = leaves.find((data: LeaveProps) => {
          return date >= data.from_date && date <= data.to_date;
        });
        const hour = data?.half_day ? 4 : 8;
        if (data) {
          total_hours += hour;
        }
        return (
          <TableCell key={date} className="text-center">
            <Typography variant="p" className="text-warning">
              {data ? floatToTime(hour) : ""}
            </Typography>
          </TableCell>
        );
      })}
      <TableCell>
        <Typography variant="p" className="text-slate-800 font-medium text-right">
          {floatToTime(total_hours)}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

const TotalHourRow = ({
  leaves,
  dates,
  tasks,
  holidays,
  working_hour,
  working_frequency,
}: {
  leaves: Array<LeaveProps>;
  dates: string[];
  tasks: TaskProps;
  holidays: string[];
  working_hour: number;
  working_frequency: WorkingFrequency;
}) => {
  let total = 0;
  return (
    <TableRow>
      <TableCell></TableCell>
      {dates.map((date: string) => {
        let isLeave = false;
        const isHoliday = holidays.includes(date);
        if (isHoliday) {
          return (
            <TableCell key={date} className="text-center">
              <Typography variant="p" className={cn("text-slate-400")}>
                {"-"}
              </Typography>
            </TableCell>
          );
        }
        let total_hours = 0;
        if (tasks) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          Object.entries(tasks).map(([task, taskData]: [string, TaskDataProps]) => {
            const data = taskData.data.find((data: TaskDataItemProps) => {
              return getDateFromDateAndTime(data.from_time) === date;
            });
            if (data && data.hours) {
              total_hours += data.hours;
            }
          });
        }
        const leaveData = leaves.find((data: LeaveProps) => {
          return date >= data.from_date && date <= data.to_date;
        });
        if (leaveData) {
          if (leaveData.half_day || (leaveData.half_day_date && leaveData.half_day_date == date)) {
            total_hours += 4;
          } else {
            total_hours += 8;
            isLeave = true;
          }
        }
        total += total_hours;
        return (
          <TableCell key={date} className="text-center">
            <Typography variant="p" className={cn("text-slate-600 ", isLeave && "text-warning")}>
              {floatToTime(total_hours)}
            </Typography>
          </TableCell>
        );
      })}
      <WeekTotal total={total} expected_hour={working_hour} frequency={working_frequency} />
    </TableRow>
  );
};
const WeekTotal = ({
  total,
  expected_hour,
  frequency,
}: {
  total: number;
  expected_hour: number;
  frequency: WorkingFrequency;
}) => {
  const expectedTime = calculateWeeklyHour(total, expected_hour, frequency);
  return (
    <TableCell>
      <Typography
        variant="p"
        className={cn(
          "text-right font-medium",
          expectedTime == 1 && "text-success",
          expectedTime == 2 && "text-warning",
          expectedTime == 0 && "text-destructive"
        )}
      >
        {floatToTime(total)}
      </Typography>
    </TableCell>
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
  const [isHovered, setIsHovered] = useState(false);
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
  const onMouseEnter: React.MouseEventHandler<HTMLTableCellElement> = () => {
    if (isDisabled) return;
    setIsHovered(true);
  };
  const onMouseLeave: React.MouseEventHandler<HTMLTableCellElement> = () => {
    if (isDisabled) return;
    setIsHovered(false);
  };
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger className={cn(isDisabled && "cursor-default")} asChild>
        <TableCell
          key={date}
          onMouseEnter={onMouseEnter}
          onClick={handleClick}
          onMouseLeave={onMouseLeave}
          className={cn(
            "text-center",
            isDisabled && "cursor-default",
            isHovered && "h-full bg-slate-100 cursor-pointer"
          )}
        >
          <span className="flex flex-col items-center">
            <Typography
              variant="p"
              className={cn(
                "text-slate-600",
                isHoliday || (isDisabled && "text-slate-400"),
                isHovered && !data?.hours && "hidden"
              )}
            >
              {data?.hours && data?.hours > 0 ? floatToTime(data?.hours || 0) : "-"}
            </Typography>
            {isHovered && data?.hours && data?.hours > 0 && <PencilLine className="text-center" size={16} />}
            {isHovered && !data?.hours && <CirclePlus className="text-center" size={16} />}
          </span>
          {data?.description && (
            <TooltipContent className="text-left whitespace-pre">{data?.description}</TooltipContent>
          )}
        </TableCell>
      </TooltipTrigger>
    </Tooltip>
  );
};

const EmptyRow = ({
  dates,
  holidays,
  onCellClick,
  disabled,
}: {
  dates: string[];
  holidays: string[];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
  disabled?: boolean;
}) => {
  return (
    <TableRow>
      <TableCell>
        <Typography variant="p" className="text-destructive">
          Add Task
        </Typography>
      </TableCell>
      {dates.map((date: string) => {
        const isHoliday = holidays.includes(date);
        return (
          <Cell
            key={date}
            date={date}
            data={undefined}
            isHoliday={isHoliday}
            onCellClick={onCellClick}
            disabled={disabled}
          />
        );
      })}
      <TableCell></TableCell>
    </TableRow>
  );
};

export const SubmitButton = ({
  start_date,
  end_date,
  onApproval,
  status,
}: {
  start_date: string;
  end_date: string;
  onApproval?: (start_date: string, end_date: string) => void;
  status: string;
}) => {
  const handleClick = () => {
    onApproval && onApproval(start_date, end_date);
  };
  if (status == "Approved") {
    return (
      <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm  ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground mr-1 text-primary bg-green-50 font-normal gap-x-2 p-2">
        <CircleCheck className="stroke-success w-4 h-4" />
        {status}
      </span>
    );
  } else if (status == "Rejected") {
    return (
      <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm  ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground mr-1 text-primary bg-red-50 font-normal gap-x-2 p-2">
        <CircleX className="stroke-destructive w-4 h-4" />
        {status}
      </span>
    );
  } else if (status == "Approval Pending") {
    return (
      <span
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm  ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground mr-1 text-primary bg-orange-50 font-normal gap-x-2 p-2"
        onClick={handleClick}
      >
        <Clock3 className="stroke-warning w-4 h-4" />
        {status}
      </span>
    );
  } else {
    return (
      <span
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm  ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground mr-1 font-normal text-slate-400 gap-x-2 p-2"
        onClick={handleClick}
      >
        <CircleCheck className="w-4 h-4" />
        {status}
      </span>
    );
  }
};

export default TimesheetTable;
