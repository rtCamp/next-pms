/**
 * External dependencies
 */
import { TableHead, TableHeader, TableRow, Typography } from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";
import { LoaderCircle, Import } from "lucide-react";

/**
 * Internal dependencies
 */
import { mergeClassNames, getBgCsssForToday } from "@/lib/utils";
import type { HeaderProps } from "./types";

/**
 * @description This is the header component for the timesheet table.
 * It is responsible for rendering the header of the timesheet table.
 *
 * @param {boolean} props.showHeading - If the heading should be shown
 */
export const Header = ({
  showHeading,
  weeklyStatus,
  importTasks,
  loadingLikedTasks,
  setTaskInLocalStorage,
  dates,
  holidays,
}: HeaderProps) => {
  if (!showHeading) return <></>;
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="max-w-sm w-2/6 ">
          <Typography variant="h6" className="font-normal text-slate-600 flex gap-x-4 items-center">
            Tasks
            {weeklyStatus != "Approved" && importTasks && (
              <span title="Import liked tasks">
                {loadingLikedTasks ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Import onClick={setTaskInLocalStorage} className="hover:cursor-pointer" />
                )}
              </span>
            )}
          </Typography>
        </TableHead>
        {dates?.map((date: string) => {
          const { date: formattedDate, day } = prettyDate(date);
          const matchingHoliday = holidays.find((item) => item.holiday_date === date);

          const result = matchingHoliday
            ? { isHoliday: true, weekly_off: matchingHoliday.weekly_off }
            : { isHoliday: false, weekly_off: false };

          return (
            <TableHead
              key={date}
              className={mergeClassNames("max-w-20 text-center px-2 min-w-20", getBgCsssForToday(date))}
            >
              <Typography
                variant="p"
                className={mergeClassNames(
                  "text-slate-600 font-medium",
                  result.isHoliday && !result.weekly_off && "text-slate-400"
                )}
              >
                {day}
              </Typography>
              <Typography
                variant="small"
                className={mergeClassNames(
                  "text-slate-500",
                  result.isHoliday && !result.weekly_off && "text-slate-300"
                )}
              >
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
