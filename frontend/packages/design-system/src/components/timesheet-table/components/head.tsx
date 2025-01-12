/**
 * External dependencies
 */
import { Import } from "lucide-react";
/**
 * Internal dependencies
 */
import { TableHead, TableHeader, TableRow } from "@design-system/components/table";
import Typography from "@design-system/components/typography";
import { cn, getBgCsssForToday } from "@design-system/utils";
import { prettyDate } from "@design-system/utils/date";
import { HolidayProps } from "../type";
import { getHolidayList } from "../utils";

type HeadProps = {
  showHeading?: boolean;
  weeklyStatus: string;
  importTasks?: (key: string) => void;
  dates: string[];
  holidays: Array<HolidayProps>;
};
const Head = ({ showHeading = true, weeklyStatus, importTasks, dates, holidays }: HeadProps) => {
  if (!showHeading) return <></>;
  const key = dates[0] + "-" + dates[dates.length - 1];
  const holidayList = getHolidayList(holidays);
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="max-w-sm w-2/6 ">
          <Typography variant="h6" className="font-normal text-slate-600 flex gap-x-4 items-center">
            Tasks
            {weeklyStatus != "Approved" && importTasks && (
              <span title="Import liked tasks">
                <Import className="hover:cursor-pointer" onClick={() => importTasks(key)} />
              </span>
            )}
          </Typography>
        </TableHead>
        {dates?.map((date: string) => {
          const { date: formattedDate, day } = prettyDate(date);
          const isHoliday = holidayList.includes(date);
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
  );
};

export default Head;
