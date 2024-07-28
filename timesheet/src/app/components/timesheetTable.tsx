import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { cn, prettyDate, getDateFromDateAndTime, floatToTime } from "@/lib/utils";
import { Typography } from "./typography";
import { useState } from "react";
import { CircleCheck, CirclePlus, CircleX, Clock3, PencilLine } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { TaskDataProps, TaskDataItemProps, LeaveProps } from "@/types/timesheet";
import { Button } from "@/app/components/ui/button";

interface TimesheetTableProps {
  dates: string[];
  holidays: string[];
  tasks: TaskDataProps;
  leaves: Array<LeaveProps>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
  hasHeading?: boolean;
}

export const TimesheetTable = ({
  dates,
  holidays,
  tasks,
  leaves,
  onCellClick,
  hasHeading = true,
}: TimesheetTableProps) => {
  return (
    <Table>
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
                <TableHead key={date} className="max-w-20">
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
              <Typography variant="p" className="text-base text-slate-600">
                Total
              </Typography>
            </TableHead>
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {Object.keys(tasks).length > 0 && (
          <TotalHourRow dates={dates} leaves={leaves} tasks={tasks} holidays={holidays} />
        )}
        {leaves.length > 0 && <LeaveRow dates={dates} leaves={leaves} />}
        {Object.keys(tasks).length == 0 && <EmptyRow dates={dates} holidays={holidays} onCellClick={onCellClick} />}
        {Object.keys(tasks).length > 0 &&
          Object.entries(tasks).map(([task, taskData]: [string, TaskDataProps]) => {
            let totalHours = 0;
            return (
              <TableRow key={task} className="border-b border-slate-200">
                <TableCell>
                  <Typography variant="p" className="text-slate-800">
                    {task}
                  </Typography>
                  <Typography variant="small" className="text-slate-500">
                    {taskData.project_name}
                  </Typography>
                </TableCell>
                {dates.map((date: string) => {
                  const data = taskData.data.find(
                    (data: TaskDataItemProps) => getDateFromDateAndTime(data.from_time) === date
                  );
                  if (data && data.hours) {
                    totalHours += data.hours;
                  }
                  const isHoliday = holidays.includes(date);
                  return <Cell date={date} data={data} isHoliday={isHoliday} onCellClick={onCellClick} />;
                })}
                <TableCell>
                  <Typography variant="p" className="text-slate-800 font-medium">
                    {floatToTime(totalHours)}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
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
          <TableCell key={date}>
            <Typography variant="p" className="text-slate-600">
              {data ? floatToTime(hour) : "-"}
            </Typography>
          </TableCell>
        );
      })}
      <TableCell>
        <Typography variant="p" className="text-slate-800 font-medium">
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
}: {
  leaves: Array<LeaveProps>;
  dates: string[];
  tasks: TaskDataProps;
  holidays: string[];
}) => {
  let total = 0;
  return (
    <TableRow>
      <TableCell></TableCell>
      {dates.map((date: string) => {
        const isHoliday = holidays.includes(date);
        if (isHoliday) {
          return (
            <TableCell key={date}>
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
          }
        }
        total += total_hours;
        return (
          <TableCell>
            <Typography variant="p" className={cn("text-slate-600", total_hours > 8 && "text-warning")}>
              {floatToTime(total_hours)}
            </Typography>
          </TableCell>
        );
      })}
      <TableCell>
        <Typography variant="p" className={cn("text-slate-800 font-medium", total > 40 && "text-warning")}>
          {floatToTime(total)}
        </Typography>
      </TableCell>
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
    <Tooltip>
      <TableCell
        key={date}
        onMouseEnter={onMouseEnter}
        onClick={handleClick}
        onMouseLeave={onMouseLeave}
        className={cn(isDisabled && "cursor-default", isHovered && "h-full bg-slate-100 text-center cursor-pointer")}
      >
        <TooltipTrigger className={cn(isDisabled && "cursor-default")}>
          {!isHovered && (
            <Typography variant="p" className={cn("text-slate-600", isHoliday || (isDisabled && "text-slate-400"))}>
              {data?.hours ? floatToTime(data?.hours || 0) : "-"}
            </Typography>
          )}
          {isHovered && data?.hours && <PencilLine className="text-center" size={16} />}
          {isHovered && !data?.hours && <CirclePlus className="text-center" size={16} />}
        </TooltipTrigger>
        {data?.description && <TooltipContent>{data?.description}</TooltipContent>}
      </TableCell>
    </Tooltip>
  );
};

const EmptyRow = ({
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
    <TableRow>
      <TableCell>
        <Typography variant="p" className="text-destructive">
          No Task found
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
      <Button variant="ghost" className="mr-1 text-primary bg-green-50 font-normal gap-x-2">
        <CircleCheck className="stroke-success w-4 h-4" />
        {status}
      </Button>
    );
  } else if (status == "Rejected") {
    return (
      <Button variant="ghost" className="mr-1 text-primary bg-red-50 font-normal gap-x-2">
        <CircleX className="stroke-destructive w-4 h-4" />
        {status}
      </Button>
    );
  } else if (status == "Approval Pending") {
    return (
      <Button variant="ghost" className="mr-1 text-primary bg-orange-50 font-normal gap-x-2" onClick={handleClick}>
        <Clock3 className="stroke-warning w-4 h-4" />
        {status}
      </Button>
    );
  } else {
    return (
      <Button variant="ghost" className="mr-1 font-normal text-slate-400 gap-x-2" onClick={handleClick}>
        <CircleCheck className="w-4 h-4" />
        {status}
      </Button>
    );
  }
};
