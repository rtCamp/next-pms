/**
 * External dependencies
 */

import { floatToTime } from "@next-pms/design-system";
import { TableCell, TableRow, Typography } from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { cn, getBgCsssForToday } from "@/lib/utils";
import { LeaveProps } from "@/types/timesheet";

type leaveRowProps = {
  leaves: Array<LeaveProps>;
  dates: string[];
  holidayList: Array<string>;
  expectedHours: number;
  rowClassName?: string;
  headingClassName?: string;
  dataCellClassName?: string;
  totalCellClassName?: string;
  showEmptyCell?: boolean;
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
  holidayList,
  expectedHours,
  rowClassName,
  headingClassName,
  dataCellClassName,
  totalCellClassName,
  showEmptyCell,
}: leaveRowProps) => {
  let totalHours = 0;

  // For each day loop over the leaves and check whether
  // the employees has leaves for that day excluding the holidays.
  // Since there can be multiple leaves for a day, we need to
  // filter the leaves for that day and calculate the total hours
  const leaveData = dates.map((date: string) => {
    let hour = 0;
    if (holidayList.includes(date)) {
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
    totalHours += hour;
    return { date, data, hour, isHoliday: false };
  });

  // Check if there are any leaves
  const hasLeaves = leaveData.some(({ data, isHoliday, hour = 0 }) => (data || isHoliday) && hour > 0);

  if (!hasLeaves) {
    return <></>;
  }

  return (
    <TableRow className={cn(rowClassName)}>
      <TableCell className={cn(headingClassName)}>
        <Typography variant="p" className="text-slate-800">
          Time Off
        </Typography>
      </TableCell>
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      {leaveData.map(({ date, data, hour, isHoliday }) => (
        <TableCell key={date} className={cn("text-center px-2", dataCellClassName, getBgCsssForToday(date))}>
          <Typography variant="p" className={isHoliday ? "text-white" : "text-warning"}>
            {hour && hour != 0 ? floatToTime(hour) : ""}
          </Typography>
        </TableCell>
      ))}
      <TableCell className={cn(totalCellClassName)}>
        <Typography variant="p" className="text-slate-800 font-medium text-right">
          {floatToTime(totalHours)}
        </Typography>
      </TableCell>
      {showEmptyCell && <TableCell className={cn("flex max-w-20 w-full justify-center items-center")}></TableCell>}
    </TableRow>
  );
};
