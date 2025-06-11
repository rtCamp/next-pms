/**
 * External dependencies
 */
import { Button, Checkbox, TextEditor, Typography } from "@next-pms/design-system/components";
import { getDateFromDateAndTimeString, prettyDate } from "@next-pms/design-system/date";
import { floatToTime, preProcessLink } from "@next-pms/design-system/utils";
import { CircleDollarSign, PencilIcon } from "lucide-react";
/**
 * Internal dependencies
 */
import { extractTextFromHTML, mergeClassNames } from "@/lib/utils";
import type { TaskDataItemProps } from "@/types/timesheet";
import { HourInput } from "../hourInput";
import type { EmployeeTimesheetListItemProps } from "./types";

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
  setIsAddTimeOpen,
  setTask,
}: EmployeeTimesheetListItemProps) => {
  return (
    <div key={index} className="flex flex-col">
      <div className={mergeClassNames("bg-muted rounded p-1  flex items-center gap-x-2", className)}>
        {showCheckbox && (
          <Checkbox
            checked={isCheckboxChecked}
            disabled={isCheckboxDisabled}
            className={mergeClassNames(checkboxClassName)}
            onCheckedChange={(checked) => onCheckedChange?.(date, checked)}
          />
        )}
        <Typography
          variant="p"
          className={mergeClassNames(
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
          <Typography variant="p" className="max-md:text-wrap text-primary/60">
            {extractTextFromHTML(holidayDescription ?? "")}
          </Typography>
        )}
        {hasLeave && !isHoliday && (
          <Typography variant="p" className="max-md:text-wrap text-primary/60">
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
          <div
            className="flex flex-col gap-x-2 p-1 mb-2 last:mb-0 border-b w-full max-w-full last:border-b-0"
            key={index}
          >
            <div className="flex gap-x-3">
              <HourInput
                disabled={task.docstatus == 1}
                data={data}
                className={mergeClassNames("w-10 p-1 h-8", hourInputClassName)}
                callback={handleTimeChange}
                employee={employee}
              />
              <div className="flex gap-x-2 justify-between items-center lg:flex-row w-full ">
                <div className="items-center flex gap-1">
                  <div className={mergeClassNames("flex flex-col max-w-full lg:max-w-52", taskClassName)}>
                    <div className="flex justify-center items-center gap-1">
                      <Typography
                        variant="p"
                        className="max-md:text-wrap truncate text-base font-medium"
                        onClick={() => onTaskClick?.(task.name)}
                      >
                        {task.subject}
                      </Typography>
                      <div
                        title={task.is_billable == 1 ? "Billable task" : ""}
                        className={mergeClassNames(
                          task.is_billable === 1 && "cursor-pointer",
                          "w-6 flex justify-center flex-none"
                        )}
                      >
                        {task.is_billable === 1 && <CircleDollarSign className="size-4 stroke-success" />}
                      </div>
                    </div>
                    <Typography
                      variant="small"
                      className="max-md:text-wrap shrink-0 font-medium truncate text-slate-500"
                    >
                      {task.project_name}
                    </Typography>
                  </div>
                </div>
                {/* actions */}
                <Button
                  onClick={() => {
                    setIsAddTimeOpen(true);
                    setTask(task);
                  }}
                  title="Edit Timesheet"
                  variant="ghost"
                  className="size-7 group"
                >
                  <PencilIcon className="size-3 text-slate-500 group-hover:text-black" />
                </Button>
              </div>
            </div>
            <p
              className="text-sm font-normal max-md:text-wrap  col-span-2  my-1 p-0 hover-content"
              onClick={(e) => e.stopPropagation()}
            >
              <TextEditor onChange={() => {}} hideToolbar={true} readOnly={true} value={description} />
            </p>
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
