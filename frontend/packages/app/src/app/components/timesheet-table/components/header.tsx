/**
 * External dependencies
 */
import { TableHead, TableHeader, TableRow, Typography } from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";
import { LoaderCircle, Import } from "lucide-react";

/**
 * Internal dependencies
 */
import { cn, getBgCsssForToday } from "@/lib/utils";

type HeaderProps = {
  dates: string[];
  holidayList: string[];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
  weeklyStatus?: string;
  importTasks?: boolean;
  loadingLikedTasks?: boolean;
  showHeading: boolean;
  setTaskInLocalStorage?: () => void;
};
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
  holidayList,
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
