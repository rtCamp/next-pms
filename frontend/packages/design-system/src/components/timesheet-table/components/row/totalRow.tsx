/**
 * Internal dependencies
 */
import { TableCell, TableRow } from "@design-system/components/table";
import Typography from "@design-system/components/typography";
import { cn, floatToTime, getBgCsssForToday, getDateFromDateAndTimeString } from "@design-system/utils";
import { LeaveProps, WorkingFrequency, TaskProps, TaskDataItemProps, TaskDataProps, HolidayProps } from "../../type";
import { calculateWeeklyHour, expectatedHours } from "../../utils";

type totalHourRowProps = {
  leaves: Array<LeaveProps>;
  dates: string[];
  tasks: TaskProps;
  holidayList: Array<HolidayProps>;
  workingHour: number;
  workingFrequency: WorkingFrequency;
  totalCellClassName?: string;
};
export const TotalRow = ({
  leaves,
  dates,
  tasks,
  holidayList,
  workingHour,
  workingFrequency,
  totalCellClassName,
}: totalHourRowProps) => {
  let total = 0;
  const dailyWorkingHours = expectatedHours(workingHour, workingFrequency);
  const expectedWeekTime = calculateWeeklyHour(workingHour, workingFrequency);
  return (
    <TableRow>
      <TableCell></TableCell>
      {dates.map((date: string) => {
        let isHoliday = false;
        const holiday = holidayList.find((holiday) => holiday.holiday_date === date);
        if (holiday) {
          isHoliday = true;
          if (!holiday.weekly_off) {
            total += workingHour;
          }
          if (isHoliday) {
            return (
              <TableCell key={date} className="text-center">
                <Typography variant="p" className={cn("text-slate-400")}>
                  {holiday.weekly_off ? "-" : floatToTime(workingHour)}
                </Typography>
              </TableCell>
            );
          }
        }
        let totalHour = 0;
        if (tasks) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          Object.entries(tasks).map(([task, taskData]: [string, TaskDataProps]) => {
            const data = taskData.data.filter((data: TaskDataItemProps) => {
              return getDateFromDateAndTimeString(data.from_time) === date;
            });
            data.forEach((item: TaskDataItemProps) => {
              totalHour += item.hours;
            });
          });
        }
        const leaveData = leaves.filter((data: LeaveProps) => {
          return date >= data.from_date && date <= data.to_date;
        });
        if (leaveData) {
          leaveData.map((item) => {
            if (item.half_day && item.half_day_date && item.half_day_date == date) {
              totalHour += dailyWorkingHours / 2;
            } else {
              totalHour += dailyWorkingHours;
            }
          });
        }
        total += totalHour;
        return (
          <TableCell key={date} className={cn("text-center px-2", getBgCsssForToday(date))}>
            <Typography variant="p" className={cn("text-slate-600 ")}>
              {floatToTime(totalHour)}
            </Typography>
          </TableCell>
        );
      })}
      <TableCell className={cn(totalCellClassName)}>
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
    </TableRow>
  );
};
