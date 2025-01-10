/**
 * Internal dependencies
 */
import { TableCell, TableRow, Typography } from "@design-system/components";
import { cn, getBgCsssForToday, floatToTime } from "@design-system/utils";
import { LeaveProps } from "../../type";

type LeaveRowProps = {
  leaves: Array<LeaveProps>;
  dates: string[];
  holidayList: Array<string>;
  workingHour: number;
  rowClassName?: string;
  headingClassName?: string;
  dataCellClassName?: string;
  totalCellClassName?: string;
};
export const LeaveRow = ({
  leaves,
  dates,
  holidayList,
  workingHour,
  rowClassName,
  headingClassName,
  dataCellClassName,
  totalCellClassName,
}: LeaveRowProps) => {
  if (!leaves.length) return <></>;
  let totalHour = 0;
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
        hour += workingHour / 2;
      } else {
        hour += workingHour;
      }
    });
    totalHour += hour;
    return { date, data, hour, isHoliday: false };
  });
  // Check if there are any leaves
  const hasLeaves = leaveData.some(({ data, isHoliday, hour }) => (data || isHoliday) && (hour ?? 0) > 0);
  if (!hasLeaves) return <></>;

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
          {floatToTime(totalHour)}
        </Typography>
      </TableCell>
    </TableRow>
  );
};
