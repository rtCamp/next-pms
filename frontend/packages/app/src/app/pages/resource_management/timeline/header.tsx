/**
 * External dependencies.
 */
import { useContext } from "react";
import { TableHead, Typography } from "@next-pms/design-system/components";
import { startOfWeek } from "date-fns";
import moment from "moment";

/**
 * Internal dependencies.
 */
import { cn, getDateTimeForMultipleTimeZoneSupport, getTodayDate, prettyDate } from "@/lib/utils";
import { ResourceAllocationItemProps } from "./types";
import { TableContext } from "../store/tableContext";
import { getDayKeyOfMoment, getMonthKey } from "../utils/dates";

interface TimeLineHeaderFunctionProps {
  getIntervalProps: () => ResourceAllocationItemProps;
  intervalContext: { interval: { startTime: number; endTime: number } };
}

const TimeLineIntervalHeader = ({ getIntervalProps, intervalContext }: TimeLineHeaderFunctionProps) => {
  const { interval } = intervalContext;
  const { startTime, endTime } = interval;
  const start = startOfWeek(getDateTimeForMultipleTimeZoneSupport(getTodayDate()), {
    weekStartsOn: 1,
  });

  return (
    <TableHead
      {...getIntervalProps()}
      className={cn("h-full pb-2 pt-1 px-0 text-center truncate cursor-pointer border-r border-gray-300")}
    >
      <Typography variant="small">
        {start.getTime() >= startTime && start.getTime() <= endTime
          ? "This Week"
          : getMonthKey(getDayKeyOfMoment(moment(startTime))) +
            " - " +
            getMonthKey(getDayKeyOfMoment(moment(endTime).add("-1", "days")))}
      </Typography>
    </TableHead>
  );
};

const TimeLineDateHeader = ({ getIntervalProps, intervalContext }: TimeLineHeaderFunctionProps) => {
  const { interval } = intervalContext;
  const { startTime } = interval;
  const { date: dateStr, day } = prettyDate(getDayKeyOfMoment(startTime));

  const start = startOfWeek(getDateTimeForMultipleTimeZoneSupport(getTodayDate()), {
    weekStartsOn: 1,
  });

  const { tableProperties, getCellWidthString } = useContext(TableContext);

  let props: ResourceAllocationItemProps = getIntervalProps();

  props = {
    ...props,
    style: { ...props.style, width: getCellWidthString(tableProperties.cellWidth), left: props.style.left - 1 },
  };

  return (
    <TableHead
      {...props}
      className={cn(
        "text-xs flex flex-col justify-end items-center border-0 p-0 h-full pb-2",
        day == "Sun" && "border-l border-gray-300",
        start.getTime() == startTime && "font-semibold"
      )}
    >
      <Typography variant="p" className={cn("text-slate-600 text-[11px]")}>
        {day}
      </Typography>
      <Typography variant="small" className={cn("text-slate-500 text-center text-[11px] max-lg:text-[0.65rem]")}>
        {dateStr}
      </Typography>
    </TableHead>
  );
};

export { TimeLineIntervalHeader, TimeLineDateHeader };
