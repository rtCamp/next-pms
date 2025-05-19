/**
 * External dependencies
 */
import { TableCell, TableRow, Typography } from "@next-pms/design-system/components";
import { getDateFromDateAndTimeString } from "@next-pms/design-system/date";
import { floatToTime } from "@next-pms/design-system/utils";

/**
 * Internal dependencies
 */
import { expectatedHours, mergeClassNames, getBgCsssForToday } from "@/lib/utils";
import type { HolidayProp, LeaveProps, TaskProps } from "@/types/timesheet";
import { WeekTotal } from "../weekTotal";
import type { TotalHourRowProps } from "./types";

/**
 * @description This component calculates the total working hours for the perticular
 * day including the leaves, holidays and tasks, and uses the `Cell` component to
 * show the total hours worked for the day.
 *
 * @param {Array} props.leaves - Array of leaves in the timesheet
 * @param {Array} props.dates - Array of dates in the timesheet
 * @param {Array} props.tasks - Array of tasks in the timesheet
 * @param {Array} props.holidays - Array of holidays in the timesheet
 * @param {number} props.workingHour - The working hours for the day
 * @param {WorkingFrequency} props.workingFrequency - The working frequency
 */

export const TotalHourRow = ({ leaves, dates, tasks, holidays, workingHour, workingFrequency }: TotalHourRowProps) => {
  let total = 0;
  const dailyWorkingHours = expectatedHours(workingHour, workingFrequency);

  return (
    <TableRow>
      <TableCell></TableCell>
      {dates.map((date) => {
        const holiday = holidays.find((holiday) => holiday.holiday_date === date);
        const totalHours =
          calculateTotalHours(tasks, date) + calculateLeaveHours(leaves, date, dailyWorkingHours, holiday);

        total += totalHours;

        if (holiday) {
          if (!holiday.weekly_off) {
            total += workingHour;
          }
          return (
            <TableCell key={date} className="text-center">
              <Typography
                variant="p"
                className={mergeClassNames(!holiday.weekly_off && "text-slate-400 dark:text-primary/50")}
              >
                {holiday.weekly_off ? floatToTime(totalHours) : floatToTime(workingHour)}
              </Typography>
            </TableCell>
          );
        }

        return (
          <TableCell key={date} className={mergeClassNames("text-center px-2", getBgCsssForToday(date))}>
            <Typography variant="p">{floatToTime(totalHours)}</Typography>
          </TableCell>
        );
      })}
      <WeekTotal total={total} expected_hour={workingHour} frequency={workingFrequency} />
    </TableRow>
  );
};

const calculateTotalHours = (tasks: TaskProps, date: string) => {
  return Object.values(tasks).reduce((total, taskData) => {
    const taskHours = taskData.data
      .filter((data) => getDateFromDateAndTimeString(data.from_time) === date)
      .reduce((sum, item) => sum + item.hours, 0);
    return total + taskHours;
  }, 0);
};

const calculateLeaveHours = (
  leaves: LeaveProps[],
  date: string,
  daily_working_hours: number,
  holiday: HolidayProp | undefined
) => {
  return leaves.reduce((total, leave) => {
    if (date >= leave.from_date && date <= leave.to_date) {
      if (!leave.is_lwp && holiday?.weekly_off) {
        return 0;
      } else if (leave.half_day && leave.half_day_date === date) {
        return total + daily_working_hours / 2;
      } else {
        return total + daily_working_hours;
      }
    }
    return total;
  }, 0);
};
