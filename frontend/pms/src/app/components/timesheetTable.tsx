import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import {
  cn,
  prettyDate,
  getDateFromDateAndTime,
  floatToTime,
  calculateWeeklyHour,
  expectatedHours,
  preProcessLink,
  getHolidayList,
} from "@/lib/utils";
import { Typography } from "./typography";
import { CircleCheck, CirclePlus, CircleX, Clock3, PencilLine, CircleDollarSign } from "lucide-react";
import { TaskDataProps, TaskProps, TaskDataItemProps, LeaveProps, HolidayProp } from "@/types/timesheet";
import { WorkingFrequency } from "@/types";
import GenWrapper from "./GenWrapper";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import { TaskLog } from "@/app/pages/task/taskLog";
import { useState } from "react";
import { Button } from "./ui/button";
import TaskStatusIndicator from "./taskStatusIndicator";
interface TimesheetTableProps {
  dates: string[];
  holidays: Array<HolidayProp>;
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
  const holiday_list = getHolidayList(holidays);
  const [isTaskLogDialogBoxOpen, setIsTaskLogDialogBoxOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>("");
  return (
    <GenWrapper>
      {isTaskLogDialogBoxOpen && (
        <TaskLog task={selectedTask} isOpen={isTaskLogDialogBoxOpen} onOpenChange={setIsTaskLogDialogBoxOpen} />
      )}
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
                const isHoliday = holiday_list.includes(date);
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
          <TotalHourRow
            dates={dates}
            leaves={leaves}
            tasks={tasks}
            holidays={holidays}
            working_frequency={working_frequency}
            working_hour={working_hour}
          />

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
                    <HoverCard openDelay={1000} closeDelay={0}>
                      <div className="flex w-full gap-2">
                        <TaskStatusIndicator actualTime={taskData?.actual_time} expectedTime={taskData?.expected_time} status={taskData?.status} className="flex-shrink-0"/>
                        <div className="flex w-full truncate overflow-hidden flex-col">
                          <HoverCardTrigger>
                            <Typography
                              variant="p"
                              className="text-slate-800 truncate overflow-hidden hover:underline"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsTaskLogDialogBoxOpen(true);
                              }}
                            >
                              {taskData.subject}
                            </Typography>
                          </HoverCardTrigger>
                          <Typography
                            variant="small"
                            className="text-slate-500 whitespace-nowrap text-ellipsis overflow-hidden "
                          >
                            {taskData.project_name}
                          </Typography>
                        </div>
                      </div>

                      <HoverCardContent className="max-w-72">{taskData.subject}</HoverCardContent>
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
                          project: taskData.project,
                          is_billable: false,
                        },
                      ];
                    }
                    const isHoliday = holiday_list.includes(date);
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

export const LeaveRow = ({
  leaves,
  dates,
  holidays,
  expectedHours,
  rowClassName,
  headingClassName,
  dataCellClassName,
  totalCellClassName,
}: {
  leaves: Array<LeaveProps>;
  dates: string[];
  holidays: Array<HolidayProp>;
  expectedHours: number;
  rowClassName?: string;
  headingClassName?: string;
  dataCellClassName?: string;
  totalCellClassName?: string;
}) => {
  const holiday_list = holidays.map((holiday) => {
    return holiday.holiday_date;
  });
  let total_hours = 0;
  const leaveData = dates.map((date: string) => {
    let hour = 0;
    if (holiday_list.includes(date)) {
      return { date, isHoliday: true };
    }
    const data = leaves.filter((data: LeaveProps) => {
      return date >= data.from_date && date <= data.to_date;
    });

    data.map((item) => {
      if (item.half_day && item.half_day_date && item.half_day_date === date) {
        hour += expectedHours / 2;
      } else {
        hour += expectedHours;
      }
    });
    total_hours += hour;
    return { date, data, hour, isHoliday: false };
  });

  // Check if there are any leaves
  const hasLeaves = leaveData.some(({ data, isHoliday, hour }) => (data || isHoliday) && hour > 0);

  if (!hasLeaves) {
    return null;
  }

  return (
    <TableRow className={cn(rowClassName)}>
      <TableCell className={cn(headingClassName)}>
        <Typography variant="p" className="text-slate-800">
          Time Off
        </Typography>
      </TableCell>
      {leaveData.map(({ date, data, hour, isHoliday }) => (
        <TableCell key={date} className={cn("text-center", dataCellClassName)}>
          <Typography variant="p" className={isHoliday ? "text-white" : "text-warning"}>
            {data ? floatToTime(hour) : ""}
          </Typography>
        </TableCell>
      ))}
      <TableCell className={cn(totalCellClassName)}>
        <Typography variant="p" className="text-slate-800 font-medium text-right">
          {floatToTime(total_hours)}
        </Typography>
      </TableCell>
    </TableRow>
  );
};
export const TotalHourRow = ({
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
  holidays: Array<HolidayProp>;
  working_hour: number;
  working_frequency: WorkingFrequency;
}) => {
  let total = 0;

  return (
    <TableRow>
      <TableCell></TableCell>
      {dates.map((date: string) => {
        let isHoliday = false;
        const holiday = holidays.find((holiday) => holiday.holiday_date === date);
        if (holiday) {
          isHoliday = true;
          if (!holiday.weekly_off) {
            total += working_hour;
          }
          if (isHoliday) {
            return (
              <TableCell key={date} className="text-center">
                <Typography variant="p" className={cn("text-slate-400")}>
                  {holiday.weekly_off ? "-" : floatToTime(working_hour)}
                </Typography>
              </TableCell>
            );
          }
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
        const leaveData = leaves.filter((data: LeaveProps) => {
          return date >= data.from_date && date <= data.to_date;
        });
        if (leaveData) {
          leaveData.map((item) => {
            if (item.half_day && item.half_day_date && item.half_day_date == date) {
              total_hours += working_hour / 2;
            } else {
              total_hours += working_hour;
            }
          });
        }
        total += total_hours;
        return (
          <TableCell key={date} className="text-center">
            <Typography variant="p" className={cn("text-slate-600 ")}>
              {floatToTime(total_hours)}
            </Typography>
          </TableCell>
        );
      })}
      <WeekTotal total={total} expected_hour={working_hour} frequency={working_frequency} />
    </TableRow>
  );
};
export const WeekTotal = ({
  total,
  expected_hour,
  frequency,
  className,
}: {
  total: number;
  expected_hour: number;
  frequency: WorkingFrequency;
  className?: string;
}) => {
  const expectedTime = calculateWeeklyHour(total, expected_hour, frequency);
  return (
    <TableCell className={cn(className)}>
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

export const Cell = ({
  date,
  data,
  isHoliday,
  onCellClick,
  disabled,
  className,
}: {
  date: string;
  data: TaskDataItemProps[];
  isHoliday: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (val) => void;
  disabled?: boolean;
  className?: string;
}) => {
  let hours = 0;
  let description = "";
  let isTimeBothBillableAndNonBillable = false;
  let isTimeBillable = false;
  if (data) {
    hours = data.reduce((sum, item) => sum + (item.hours || 0), 0);
    description = data.reduce((desc, item) => desc + (item.description ? item.description + "\n" : ""), "").trim();
  }
  if (data && data.length > 0) {
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
      project: data[0].project ?? "",
    };
    onCellClick && onCellClick(value);
  };

  return (
    <HoverCard openDelay={1000} closeDelay={0}>
      <TableCell
        key={date}
        onClick={handleClick}
        className={cn(
          "text-center group",
          isDisabled && "cursor-default",
          "hover:h-full hover:bg-slate-100 hover:cursor-pointer",
          className
        )}
      >
        <HoverCardTrigger className={cn(isDisabled && "cursor-default")}>
          <span className="flex flex-col items-center justify-center ">
            <Typography
              variant="p"
              className={cn(
                "text-slate-600",
                isHoliday || (isDisabled && "text-slate-400"),
                !hours && !isDisabled && "group-hover:hidden"
              )}
            >
              {hours > 0 ? floatToTime(hours || 0) : "-"}
            </Typography>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            {(isTimeBothBillableAndNonBillable || isTimeBillable) && (
              <CircleDollarSign
                className={cn(
                  "stroke-slate-500 w-4 h-4 ",
                  !isDisabled && "group-hover:hidden",
                  isTimeBillable && "stroke-success"
                )}
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

export const EmptyRow = ({
  dates,
  holidays,
  onCellClick,
  disabled,
  rowClassName,
  headingCellClassName,
  totalCellClassName,
  cellClassName,
}: {
  dates: string[];
  holidays: Array<HolidayProp>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
  disabled?: boolean;
  rowClassName?: string;
  headingCellClassName?: string;
  totalCellClassName?: string;
  cellClassName?: string;
}) => {
  const holiday_list = getHolidayList(holidays);
  return (
    <TableRow className={cn(rowClassName)}>
      <TableCell className={cn("min-w-[24rem]", headingCellClassName)}>
        <span className="text-destructive"></span>
      </TableCell>
      {dates.map((date: string) => {
        const isHoliday = holiday_list.includes(date);
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
            project: "",
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
            className={cellClassName}
          />
        );
      })}
      <TableCell className={cn(totalCellClassName)}></TableCell>
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
  return (
    <Button
      variant="ghost"
      className={cn(
        "font-normal",
        (status == "Approved" || status == "Partially Approved") && "bg-green-50 text-success",
        (status == "Rejected" || status == "Partially Rejected") && "bg-red-50 text-destructive",
        status == "Approval Pending" && "bg-orange-50 text-warning",
        status == "Not Submitted" && "text-slate-400"
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (status != "Approved") {
          handleClick();
        }
      }}
    >
      {(status == "Approved" || status == "Partially Approved") && <CircleCheck className="stroke-success" />}
      {(status == "Rejected" || status == "Partially Rejected") && <CircleX className="stroke-destructive" />}
      {status == "Approval Pending" && <Clock3 className="stroke-warning" />}
      {status == "Not Submitted" && <CircleCheck className="" />}
      {status}
    </Button>
  );
};

export default TimesheetTable;
