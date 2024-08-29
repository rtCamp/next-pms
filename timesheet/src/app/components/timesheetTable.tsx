import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import {
  cn,
  prettyDate,
  getDateFromDateAndTime,
  floatToTime,
  calculateWeeklyHour,
  expectatedHours,
  preProcessLink,
} from "@/lib/utils";
import { Typography } from "./typography";
import { CircleCheck, CirclePlus, CircleX, Clock3, PencilLine, CircleDollarSign } from "lucide-react";
import { TaskDataProps, TaskProps, TaskDataItemProps, LeaveProps } from "@/types/timesheet";
import { WorkingFrequency } from "@/types";
import GenWrapper from "./GenWrapper";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";

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
          {leaves.length > 0 && (
            <LeaveRow
              dates={dates}
              leaves={leaves}
              holidays={holidays}
              expectedHours={expectatedHours(working_hour, working_frequency)}
            />
          )}
          {Object.keys(tasks).length == 0 && (
            <EmptyRow dates={dates} holidays={holidays} onCellClick={onCellClick} disabled={disabled} />
          )}
          {Object.keys(tasks).length > 0 &&
            Object.entries(tasks).map(([task, taskData]: [string, TaskDataProps]) => {
              let totalHours = 0;
              return (
                <TableRow key={task} className="border-b border-slate-200">
                  <TableCell className="cursor-pointer max-w-sm">
                    <HoverCard openDelay={0} closeDelay={0}>
                      <HoverCardTrigger>
                        <Typography variant="p" className="text-slate-800 truncate overflow-hidden ">
                          {task}
                        </Typography>
                      </HoverCardTrigger>
                      <Typography
                        variant="small"
                        className="text-slate-500 whitespace-nowrap text-ellipsis overflow-hidden "
                      >
                        {taskData.project_name}
                      </Typography>

                      <HoverCardContent className="max-w-72">{task}</HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  {dates.map((date: string) => {
                    let data = taskData.data.filter(
                      (data: TaskDataItemProps) => getDateFromDateAndTime(data.from_time) === date
                    );
                    data.forEach((item: TaskDataItemProps) => {
                      totalHours += item.hours;
                    });

                    if (data.length === 0) {
                      data = [
                        {
                          hours: 0,
                          description: "",
                          name: "",
                          parent: "",
                          task: taskData.name,
                          from_time: date,
                          docstatus: 0,
                          is_billable: false,
                        },
                      ];
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
    <TableRow>
      <TableCell>
        <Typography variant="p" className="text-slate-800">
          Time Off
        </Typography>
      </TableCell>
      {leaveData.map(({ date, data, hour, isHoliday }) => (
        <TableCell key={date} className="text-center">
          <Typography variant="p" className={isHoliday ? "text-white" : "text-warning"}>
            {data ? floatToTime(hour) : ""}
          </Typography>
        </TableCell>
      ))}
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
        // weekends here mean is the day a saturday/sunday or not
        const dateObj = new Date(date);
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
        if (isHoliday) {
          if (!isWeekend) total += working_hour;
          return (
            <TableCell key={date} className="text-center">
              <Typography variant="p" className={cn("text-slate-400")}>
                {isWeekend ? "-" : floatToTime(working_hour)}
              </Typography>
            </TableCell>
          );
        }
        let total_hours = 0;
        if (tasks) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          Object.entries(tasks).map(([task, taskData]: [string, TaskDataProps]) => {
            const data = taskData.data.filter((data: TaskDataItemProps) => {
              return getDateFromDateAndTime(data.from_time) === date;
            });
            data.forEach((item: TaskDataItemProps) => {
              total_hours += item.hours;
            });
          });
        }
        const leaveData = leaves.find((data: LeaveProps) => {
          return date >= data.from_date && date <= data.to_date;
        });
        if (leaveData) {
          if (leaveData.half_day || (leaveData.half_day_date && leaveData.half_day_date == date)) {
            total_hours += working_hour / 2;
          } else {
            total_hours += working_hour;
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
  data: TaskDataItemProps[];
  isHoliday: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (val) => void;
  disabled?: boolean;
}) => {
  let hours = 0;
  let description = "";
  let isTimeBothBillableAndNonBillable = false;
  let isTimeBillable = false;
  if (data) {
    hours = data.reduce((sum, item) => sum + (item.hours || 0), 0);
    description = data.reduce((desc, item) => desc + (item.description ? item.description + "\n" : ""), "").trim();
  }
  if (data && data.length > 1) {
    isTimeBothBillableAndNonBillable =
      data.some((item) => item.is_billable == false) && data.some((item) => item.is_billable == true);

    isTimeBillable = data.every((item) => item.is_billable == true);
  }
  const isDisabled = disabled || data?.[0]?.docstatus === 1;

  const handleClick = () => {
    if (isDisabled) return;
    const value = {
      date: date,
      hours: hours,
      description: "",
      name: "",
      task: data[0].task ?? "",
    };
    onCellClick && onCellClick(value);
  };

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <TableCell
        key={date}
        onClick={handleClick}
        className={cn(
          "text-center group",
          isDisabled && "cursor-default",
          "hover:h-full hover:bg-slate-100 hover:cursor-pointer"
        )}
      >
        <HoverCardTrigger className={cn("", isDisabled && "cursor-default")}>
          <span className="flex flex-col items-center ">
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
            {(isTimeBothBillableAndNonBillable || isTimeBillable) && (
              <CircleDollarSign
                className={cn("stroke-slate-500 w-4 h-4  group-hover:hidden", isTimeBillable && "stroke-success")}
              />
            )}
            <PencilLine
              className={cn("text-center hidden", hours > 0 && !isDisabled && "group-hover:block")}
              size={16}
            />
            <CirclePlus className={cn("text-center hidden", !hours && !isDisabled && "group-hover:block ")} size={16} />
          </span>
        </HoverCardTrigger>
        {description && (
          <HoverCardContent className="text-left whitespace-pre text-wrap w-full max-w-96 max-h-52 overflow-auto">
            <p dangerouslySetInnerHTML={{ __html: preProcessLink(description) }}></p>
          </HoverCardContent>
        )}
      </TableCell>
    </HoverCard>
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
      <TableCell className="min-w-[24rem]">
        <Typography variant="p" className="text-destructive">
          Add Task
        </Typography>
      </TableCell>
      {dates.map((date: string) => {
        const isHoliday = holidays.includes(date);
        const value = [
          {
            hours: 0,
            description: "",
            name: "",
            docstatus: 0 as 0 | 1,
            is_billable: false,
            from_time: date,
            task: "",
            parent: "",
          },
        ];
        return (
          <Cell
            key={date}
            date={date}
            data={value}
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
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApproval && onApproval(start_date, end_date);
  };
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm  ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground mr-1 text-primary font-normal gap-x-2 p-2",
        (status == "Approved" || status == "Partially Approved") && "bg-green-50",
        (status == "Rejected" || status == "Partially Rejected") && "bg-red-50",
        status == "Approval Pending" && "bg-orange-50",
        status == "Not Submitted" && "text-slate-400"
      )}
      onClick={status != "Approved" ? handleClick : undefined}
    >
      {(status == "Approved" || status == "Partially Approved") && <CircleCheck className="stroke-success w-4 h-4" />}
      {(status == "Rejected" || status == "Partially Rejected") && <CircleX className="stroke-destructive w-4 h-4" />}
      {status == "Approval Pending" && <Clock3 className="stroke-warning w-4 h-4" />}
      {status == "Not Submitted" && <CircleCheck className="w-4 h-4" />}
      {status}
    </span>
  );
};

export default TimesheetTable;
