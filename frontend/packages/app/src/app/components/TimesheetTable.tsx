/**
 * External dependencies
 */

import { useCallback, useEffect, useState } from "react";
import { useFrappePostCall } from "frappe-react-sdk";
import { CircleCheck, CircleDollarSign, CirclePlus, CircleX, Clock3, PencilLine, Import, LoaderCircle } from "lucide-react";
/**
 * Internal dependencies
 */
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { TaskLog } from "@/app/pages/task/TaskLog";
import { setLocalStorage, hasKeyInLocalStorage, getLocalStorage, removeLocalStorage } from "@/lib/storage";
import {
  calculateWeeklyHour,
  cn,
  expectatedHours,
  floatToTime,
  getDateFromDateAndTime,
  getHolidayList,
  preProcessLink,
  prettyDate,
  getBgCsssForToday,
} from "@/lib/utils";
import { TaskData, WorkingFrequency } from "@/types";
import { HolidayProp, LeaveProps, TaskDataItemProps, TaskDataProps, TaskProps } from "@/types/timesheet";
import GenWrapper from "./GenWrapper";
import TaskStatusIndicator from "./taskStatusIndicator";
import { Typography } from "./typography";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { TaskStatus } from "../pages/task/TaskStatus";

type timesheetTableProps = {
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
  weekly_status?: string;
  importTasks?: boolean;
};
type leaveRowProps = {
  leaves: Array<LeaveProps>;
  dates: string[];
  holidays: Array<HolidayProp>;
  expectedHours: number;
  rowClassName?: string;
  headingClassName?: string;
  dataCellClassName?: string;
  totalCellClassName?: string;
};
type totalHourRowProps = {
  leaves: Array<LeaveProps>;
  dates: string[];
  tasks: TaskProps;
  holidays: Array<HolidayProp>;
  working_hour: number;
  working_frequency: WorkingFrequency;
};
type weekTotalProps = {
  total: number;
  expected_hour: number;
  frequency: WorkingFrequency;
  className?: string;
};
type cellProps = {
  date: string;
  data: TaskDataItemProps[];
  isHoliday: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (val) => void;
  disabled?: boolean;
  className?: string;
};
type emptyRowProps = {
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
  setSelectedTask: React.Dispatch<React.SetStateAction<string>>;
  setIsTaskLogDialogBoxOpen: React.Dispatch<React.SetStateAction<boolean>>;
  taskData?: TaskDataProps;
  name?: string;
};
type submitButtonProps = {
  start_date: string;
  end_date: string;
  onApproval?: (start_date: string, end_date: string) => void;
  status: string;
};

/**
 * Timesheet Table
 * @description The main component to show the timesheet grid.
 *
 * @param {Array} props.dates - Array of dates in the timesheet
 * @param {Array} props.holidays - Array of holidays in the timesheet
 * @param {Array} props.tasks - Array of tasks in the timesheet
 * @param {Array} props.leaves - Array of leaves in the timesheet
 * @param {Function} props.onCellClick - Function to call when the cell is clicked
 * @param {boolean} props.hasHeading - If the table has a heading
 * @param {number} props.working_hour - The working hours for the day
 * @param {WorkingFrequency} props.working_frequency - The working frequency
 * @param {boolean} props.disabled - If the timesheet is disabled
 * @param {string} props.weekly_status - The status of the timesheet
 */
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
  weekly_status,
  importTasks = false,
}: timesheetTableProps) => {
  const holiday_list = getHolidayList(holidays);
  const [isTaskLogDialogBoxOpen, setIsTaskLogDialogBoxOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const { call: fetchLikedTask,loading:loadingLikedTasks } = useFrappePostCall("next_pms.timesheet.api.task.get_liked_tasks");
  const key = dates[0] + "-" + dates[dates.length - 1];
  const has_liked_task = hasKeyInLocalStorage(key);

  const setTaskInLocalStorage = () => {
    fetchLikedTask({}).then((res) => {
      setLocalStorage(key, res.message);
    });
  };

  const liked_tasks = has_liked_task ? getLocalStorage(key) ?? [] : [];

  const filteredLikedTasks = liked_tasks.filter(
    (likedTask: { name: string }) => !Object.keys(tasks).includes(likedTask.name)
  );

  const deleteTaskFromLocalStorage = useCallback(() => {
    removeLocalStorage(key);
  }, [key]);

  useEffect(() => {
    if (weekly_status === "Approved") {
      deleteTaskFromLocalStorage();
    }
  }, [deleteTaskFromLocalStorage, weekly_status]);
  return (
    <GenWrapper>
      {isTaskLogDialogBoxOpen && (
        <TaskLog task={selectedTask} isOpen={isTaskLogDialogBoxOpen} onOpenChange={setIsTaskLogDialogBoxOpen} />
      )}
      <Table>
        {hasHeading && (
          <TableHeader>
            <TableRow>
              <TableHead className="max-w-sm w-2/6 ">
                <Typography variant="h6" className="font-normal text-slate-600 flex gap-x-4 items-center">
                  Tasks
                  {weekly_status != "Approved" && importTasks && (
                    <span title="Import liked tasks">
                      {loadingLikedTasks?<LoaderCircle className="animate-spin"/>:<Import onClick={setTaskInLocalStorage} className="hover:cursor-pointer" />}
                    </span>
                  )}
                </Typography>
              </TableHead>
              {dates?.map((date: string) => {
                const { date: formattedDate, day } = prettyDate(date);
                const isHoliday = holiday_list.includes(date);
                return (
                  <TableHead key={date} className={cn("max-w-20 text-center px-2", getBgCsssForToday(date))}>
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

          {weekly_status != "Approved" && (
            <EmptyRow
              dates={dates}
              holidays={holidays}
              onCellClick={onCellClick}
              setSelectedTask={setSelectedTask}
              disabled={disabled}
              setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
            />
          )}
          {weekly_status != "Approved" &&
            filteredLikedTasks.length > 0 &&
            filteredLikedTasks.map((task) => {
              return (
                <EmptyRow
                  key={task.name}
                  dates={dates}
                  holidays={holidays}
                  onCellClick={onCellClick}
                  setSelectedTask={setSelectedTask}
                  disabled={disabled}
                  setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
                  name={task.name}
                  taskData={task}
                />
              );
            })}
          {Object.keys(tasks).length > 0 &&
            Object.entries(tasks).map(([task, taskData]: [string, TaskDataProps]) => {
              let totalHours = 0;
              return (
                <TableRow key={task} className="border-b border-slate-200">
                  <TableCell className="cursor-pointer max-w-sm">
                    <TaskHoverCard
                      name={task}
                      taskData={taskData}
                      setSelectedTask={setSelectedTask}
                      setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
                    />
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

/**
 * @description This component calculates the total leaves for the perticular
 * day and uses the `Cell` component to show the total hours of leave
 * for the day.
 *
 * @param {Array} props.leaves - Array of leaves in the timesheet
 * @param {Array} props.dates - Array of dates in the timesheet
 * @param {Array} props.holidays - Array of holidays in the timesheet
 * @param {number} props.expectedHours - The expected hours for the day
 * @param {string} props.rowClassName - Class name for the row
 * @param {string} props.headingClassName - Class name for the heading cell
 * @param {string} props.dataCellClassName - Class name for the data cell
 * @param {string} props.totalCellClassName - Class name for the total cell
 */
export const LeaveRow = ({
  leaves,
  dates,
  holidays,
  expectedHours,
  rowClassName,
  headingClassName,
  dataCellClassName,
  totalCellClassName,
}: leaveRowProps) => {
  const holiday_list = holidays.map((holiday) => {
    return holiday.holiday_date;
  });
  let total_hours = 0;
  // For each day loop over the leaves and check whether
  // the employees has leaves for that day excluding the holidays.
  // Since there can be multiple leaves for a day, we need to
  // filter the leaves for that day and calculate the total hours
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
        <TableCell key={date} className={cn("text-center px-2", dataCellClassName, getBgCsssForToday(date))}>
          <Typography variant="p" className={isHoliday ? "text-white" : "text-warning"}>
            {hour && hour != 0 ? floatToTime(hour) : ""}
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

/**
 * @description This component calculates the total working hours for the perticular
 * day including the leaves, holidays and tasks, and uses the `Cell` component to
 * show the total hours worked for the day.
 *
 * @param {Array} props.leaves - Array of leaves in the timesheet
 * @param {Array} props.dates - Array of dates in the timesheet
 * @param {Array} props.tasks - Array of tasks in the timesheet
 * @param {Array} props.holidays - Array of holidays in the timesheet
 * @param {number} props.working_hour - The working hours for the day
 * @param {WorkingFrequency} props.working_frequency - The working frequency
 */
export const TotalHourRow = ({
  leaves,
  dates,
  tasks,
  holidays,
  working_hour,
  working_frequency,
}: totalHourRowProps) => {
  let total = 0;
  const daily_working_hours = expectatedHours(working_hour, working_frequency);
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
              total_hours += daily_working_hours / 2;
            } else {
              total_hours += daily_working_hours;
            }
          });
        }
        total += total_hours;
        return (
          <TableCell key={date} className={cn("text-center px-2", getBgCsssForToday(date))}>
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

/**
 * @description This component shows the total hours for the week,
 * to the far right in the timesheet grid. It calculates the expected
 * working hours for the week and compares it with the total hours
 * and show indicator for hours based on the expected hours.
 *
 * @param {number} props.total - The total hours for the week
 * @param {number} props.expected_hour - The expected hours for the week
 * @param {WorkingFrequency} props.frequency - The working frequency
 * @param {string} props.className - Class name for the component
 */
export const WeekTotal = ({ total, expected_hour, frequency, className }: weekTotalProps) => {
  const expectedWeekTime = calculateWeeklyHour(expected_hour, frequency);
  return (
    <TableCell className={cn(className)}>
      <Typography
        variant="p"
        className={cn(
          "text-right font-medium",
          expectedWeekTime == total && "text-success",
          expectedWeekTime < 2 && "text-warning",
          expectedWeekTime > total && "text-destructive"
        )}
      >
        {floatToTime(total)}
      </Typography>
    </TableCell>
  );
};

/**
 * @description This is the main component for the timesheet table cell.
 * It is responsible for rendering the data in the grid, show tooltip on hover and
 * open the dialog box to add/edit time on click.
 *
 * @param {string} props.date - The date of the cell
 * @param {Array} props.data - The data for the cell
 * @param {boolean} props.isHoliday - If the date is a holiday
 * @param {Function} props.onCellClick - Function to call when the cell is clicked
 * @param {boolean} props.disabled - If the timesheet is disabled
 * @param {string} props.className - Class name for the cell
 */
export const Cell = ({ date, data, isHoliday, onCellClick, disabled, className }: cellProps) => {
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
          "text-center group px-2",
          isDisabled && "cursor-default",
          "hover:h-full hover:bg-slate-100 hover:cursor-pointer",
          getBgCsssForToday(date),
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

/**
 * Empty Row
 * @description The component shows table row with empty cells in timesheet grid,
 * which onClick event opens the dialog box to add time.
 *
 * @param {Array} props.dates - Array of dates in the timesheet
 * @param {Array} props.holidays - Array of holidays in the timesheet
 * @param {Function} props.onCellClick - Function to call when the cell is clicked
 * @param {boolean} props.disabled - If the timesheet is disabled
 * @param {string} props.rowClassName - Class name for the row
 * @param {string} props.headingCellClassName - Class name for the heading cell
 * @param {string} props.totalCellClassName - Class name for the total cell
 * @param {string} props.cellClassName - Class name for the cell
 */
export const EmptyRow = ({
  dates,
  holidays,
  onCellClick,
  disabled,
  rowClassName,
  headingCellClassName,
  totalCellClassName,
  cellClassName,
  setSelectedTask,
  setIsTaskLogDialogBoxOpen,
  taskData,
  name,
}: emptyRowProps) => {
  const holiday_list = getHolidayList(holidays);
  return (
    <TableRow className={cn(rowClassName)}>
      <TableCell className={cn("max-w-sm", headingCellClassName)}>
        {name && (
          <TaskHoverCard
            taskData={taskData}
            name={name}
            setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
            setSelectedTask={setSelectedTask}
          />
        )}
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
            task: taskData?.name ?? "",
            parent: "",
            project: taskData?.project ?? "",
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

/**
 * Submit Button
 * @description Button to show the status of the timesheet & to submit the timesheet.
 *
 * @param {string} props.start_date - Start date of the timesheet
 * @param {string} props.end_date - End date of the timesheet
 * @param {Function} props.onApproval - Function to call when the button is clicked
 * @param {string} props.status - Status of the timesheet
 */
export const SubmitButton = ({ start_date, end_date, onApproval, status }: submitButtonProps) => {
  const handleClick = () => {
    onApproval && onApproval(start_date, end_date);
  };
  return (
    <Button
      variant="ghost"
      asChild
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
      <span>
        {(status == "Approved" || status == "Partially Approved") && <CircleCheck className="stroke-success" />}
        {(status == "Rejected" || status == "Partially Rejected") && <CircleX className="stroke-destructive" />}
        {status == "Approval Pending" && <Clock3 className="stroke-warning" />}
        {status == "Not Submitted" && <CircleCheck className="" />}
        {status}
      </span>
    </Button>
  );
};

const TaskHoverCard = ({ name, taskData, setSelectedTask, setIsTaskLogDialogBoxOpen }) => {
  return (
    <HoverCard openDelay={1000} closeDelay={0}>
      <div className="flex w-full gap-2">
        <TaskStatusIndicator
          actualTime={taskData.actual_time}
          expectedTime={taskData.expected_time}
          status={taskData.status}
          className="flex-shrink-0"
        />
        <div className="flex w-full truncate overflow-hidden flex-col">
          <HoverCardTrigger>
            <Typography
              variant="p"
              className="text-slate-800 truncate overflow-hidden hover:underline"
              onClick={() => {
                setSelectedTask(name);
                setIsTaskLogDialogBoxOpen(true);
              }}
            >
              {taskData.subject}
            </Typography>

            <Typography variant="small" className="text-slate-500 whitespace-nowrap text-ellipsis overflow-hidden ">
              {taskData?.project_name}
            </Typography>
          </HoverCardTrigger>
        </div>
      </div>

      <HoverCardContent className="max-w-md w-full">
        <span className="flex gap-x-2">
          <div>
            <Typography>{taskData.subject}</Typography>
            <Typography variant="small" className="text-slate-500 whitespace-nowrap text-ellipsis overflow-hidden ">
              {taskData.project_name}
            </Typography>
          </div>
          <span>
            <TaskStatus status={taskData.status as TaskData["status"]} />
          </span>
        </span>
        <Separator className="my-1" />
        <div className="flex  justify-between">
          <Typography>Estimated Time</Typography>
          <Typography>{floatToTime(taskData.expected_time)}</Typography>
        </div>
        <div className="flex  justify-between">
          <Typography>Actual Time</Typography>
          <Typography
            className={cn(
              taskData.actual_time > taskData.expected_time && "text-destructive",
              taskData.actual_time < taskData.expected_time && "text-success"
            )}
          >
            {floatToTime(taskData.actual_time)}
          </Typography>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
export default TimesheetTable;
