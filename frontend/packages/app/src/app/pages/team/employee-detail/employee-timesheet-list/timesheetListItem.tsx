/**
 * External dependencies
 */
import { Checkbox, Separator, Typography } from "@next-pms/design-system/components";
import { getDateFromDateAndTimeString, prettyDate } from "@next-pms/design-system/date";
import { floatToTime, preProcessLink } from "@next-pms/design-system/utils";
import { CircleDollarSign } from "lucide-react";
/**
 * Internal dependencies
 */
import { cn } from "@/lib/utils";
import { NewTimesheetProps, TaskDataItemProps } from "@/types/timesheet";
import { HourInput } from "../hourInput";

interface EmployeeTimesheetListItemProps {
  showCheckbox?: boolean;
  onCheckedChange?: (date: string, checked: boolean | string) => void;
  index: number;
  className?: string;
  isCheckboxChecked?: boolean;
  isCheckboxDisabled?: boolean;
  checkboxClassName?: string;
  date: string;
  totalHours: number;
  isTimeExtended: number;
  isHoliday: boolean;
  hasLeave?: boolean;
  holidayDescription?: string;
  isHalfDayLeave?: boolean;
  dailyWorkingHour?: number;
  tasks: Array<TaskDataItemProps>;
  employee: string;
  handleTimeChange: (data: NewTimesheetProps) => void;
  onTaskClick?: (name: string) => void;
  hourInputClassName?: string;
  taskClassName?: string;
}

export const EmployeeTimesheetListItem = ({
  showCheckbox,
  isCheckboxChecked,
  isCheckboxDisabled,
  onCheckedChange,
  index,
  className,
  checkboxClassName,
  date,
  totalHours,
  isTimeExtended,
  isHoliday,
  holidayDescription,
  hasLeave,
  isHalfDayLeave,
  dailyWorkingHour,
  employee,
  tasks,
  handleTimeChange,
  onTaskClick,
  hourInputClassName,
  taskClassName,
}: EmployeeTimesheetListItemProps) => {
  return (
    <div key={index} className="flex flex-col ">
      <div className={cn("bg-gray-100 rounded p-1 border-b flex items-center gap-x-2", className)}>
        {showCheckbox && (
          <Checkbox
            checked={isCheckboxChecked}
            disabled={isCheckboxDisabled}
            className={cn(checkboxClassName)}
            onCheckedChange={(checked) => onCheckedChange?.(date, checked)}
          />
        )}
        <Typography
          variant="p"
          className={cn(
            "max-md:text-wrap",
            isTimeExtended == 0 && "text-destructive",
            isTimeExtended && "text-success",
            isTimeExtended == 2 && "text-warning"
          )}
        >
          {floatToTime(totalHours)}h
        </Typography>
        <Typography variant="p" className="max-md:text-wrap">
          {prettyDate(date).date}
        </Typography>
        {isHoliday && (
          <Typography variant="p" className="max-md:text-wrap text-gray-600">
            {holidayDescription}
          </Typography>
        )}
        {hasLeave && !isHoliday && (
          <Typography variant="p" className="max-md:text-wrap text-gray-600">
            ({isHalfDayLeave && totalHours != dailyWorkingHour ? "Half day leave" : "Full Day Leave"})
          </Typography>
        )}
      </div>
      {tasks?.map((task: TaskDataItemProps, index: number) => {
        const data = {
          name: task.name,
          parent: task.parent,
          task: task.task,
          employee: employee,
          date: getDateFromDateAndTimeString(task.from_time),
          description: task.description,
          hours: task.hours,
          is_billable: task.is_billable,
        };
        const description = preProcessLink(task.description ?? "");
        return (
          <div className="flex gap-x-2 py-1 pl-1 border-b w-full max-w-full last:border-b-0" key={index}>
            <HourInput
              disabled={task.docstatus == 1}
              data={data}
              className={cn("w-10 p-1 ml-6 h-8", hourInputClassName)}
              callback={handleTimeChange}
              employee={employee}
            />
            <div className=" gap-x-2 flex flex-col lg:flex-row w-full ">
              <div className="flex gap-1">
                <div
                  title={task.is_billable == 1 ? "Billable task" : ""}
                  className={cn(task.is_billable === 1 && "cursor-pointer", "w-6 flex justify-center flex-none")}
                >
                  {task.is_billable === 1 && <CircleDollarSign className="w-4 h-4 mt-1 stroke-success" />}
                </div>
                <div className={cn("flex flex-col max-w-full lg:max-w-52", taskClassName)}>
                  <Typography
                    variant="p"
                    className="max-md:text-wrap truncate"
                    onClick={() => onTaskClick?.(task.name)}
                  >
                    {task.subject}
                  </Typography>
                  <Typography variant="small" className="max-md:text-wrap truncate text-slate-500">
                    {task.project_name}
                  </Typography>
                </div>
              </div>
              <Separator className="my-2  max-w-full lg:hidden" />
              <p
                className="text-sm font-normal max-md:text-wrap  col-span-2 max-md:px-4 my-1"
                dangerouslySetInnerHTML={{ __html: description }}
              ></p>
            </div>
          </div>
        );
      })}
      {tasks.length == 0 && (
        <Typography variant="p" className="text-center p-3 text-gray-400">
          No data
        </Typography>
      )}
    </div>
  );
};
