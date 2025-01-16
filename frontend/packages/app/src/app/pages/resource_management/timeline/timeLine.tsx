/**
 * External dependencies.
 */
import { useContext, useEffect } from "react";
import Timeline, { DateHeader, SidebarHeader, TimelineHeaders } from "react-calendar-timeline";
import { TableHead, Typography } from "@next-pms/design-system/components";
import { Moment } from "moment";

/**
 * Internal dependencies.
 */
import { cn, getDateTimeForMultipleTimeZoneSupport, getTodayDate, prettyDate } from "@/lib/utils";
import ResourceTimeLineGroup from "./group";
import { TableContext } from "../contexts/tableContext";
import { TimeLineContext } from "../contexts/timeLineContext";
import { startOfWeek } from "date-fns";
import { getMonthKey } from "../utils/dates";

const ResourceTimeLine = ({ data }) => {
  const { tableProperties, getCellWidthString } = useContext(TableContext);
  const { employees, allocations, setEmployeesData, setCustomerData, setAllocationsData } = useContext(TimeLineContext);

  const start = startOfWeek(getDateTimeForMultipleTimeZoneSupport(getTodayDate()), {
    weekStartsOn: 1,
  });

  useEffect(() => {
    if (!data.employees) return;
    setEmployeesData(data.employees, "SET");
    setCustomerData(data.customers, "SET");
    setAllocationsData(data.resource_allocations, "SET");
  }, [data, setAllocationsData, setCustomerData, setEmployeesData]);

  const getIntervalHeader = ({ getIntervalProps, intervalContext, data }): any => {
    const { interval } = intervalContext;
    const { startTime, endTime } = interval;
    let props = getIntervalProps();
    props = { ...props, style: { ...props.style, width: getCellWidthString(tableProperties.cellWidth * 7) } };
    return (
      <Typography
        variant="small"
        {...props}
        className={cn("py-2 text-center truncate cursor-pointer border-r border-gray-300")}
      >
        {getMonthKey(getDayKeyOfMoment(startTime)) + " - " + getMonthKey(getDayKeyOfMoment(endTime.add("-1", "days")))}
      </Typography>
    );
  };

  const getDateHeader = ({ getIntervalProps, intervalContext, data }): any => {
    const { interval } = intervalContext;
    const { startTime, endTime } = interval;
    const { date: dateStr, day } = prettyDate(getDayKeyOfMoment(startTime));

    let props = getIntervalProps();
    props = { ...props, style: { ...props.style, width: getCellWidthString(tableProperties.cellWidth) } };

    return (
      <TableHead {...props} className={cn("text-xs flex flex-col justify-center items-center border-0")}>
        <Typography variant="p" className={cn("text-slate-600 text-[11px]")}>
          {day}
        </Typography>
        <Typography variant="small" className={cn("text-slate-500 text-center text-[11px] max-lg:text-[0.65rem]")}>
          {dateStr}
        </Typography>
      </TableHead>
    );
  };

  const getDayKeyOfMoment = (dateTime: Moment): string => {
    return dateTime.format("YYYY-MM-DD");
  };

  if (employees.length == 0) {
    return <></>;
  }

  return (
    <>
      {/* Full ts support is in beta version for now */}
      {/* @ts-ignore */}
      <Timeline
        groups={employees}
        items={allocations}
        defaultTimeStart={start.getTime()}
        defaultTimeEnd={start.getTime() + 18 * 60 * 60 * 1000 * 24}
        sidebarWidth={tableProperties.firstCellWidth * 16}
        minZoom={(365.24 * 86400 * 1000) / 12}
        maxZoom={(365.24 * 86400 * 1000) / 12}
        lineHeight={40}
        itemHeightRatio={0.75}
        canChangeGroup={true}
        stackItems={true}
        canResize="both"
        groupRenderer={ResourceTimeLineGroup}
      >
        <TimelineHeaders className="bg-slate-50 flex items-center text-[14px]">
          <SidebarHeader>
            {() => {
              return (
                <TableHead
                  className={cn("flex items-center")}
                  style={{ width: getCellWidthString(tableProperties.firstCellWidth) }}
                >
                  Members
                </TableHead>
              );
            }}
          </SidebarHeader>
          <DateHeader unit="week" height={40} intervalRenderer={getIntervalHeader} />
          <DateHeader
            style={{ width: tableProperties.cellWidth }}
            unit="day"
            height={40}
            intervalRenderer={getDateHeader}
          />
        </TimelineHeaders>
      </Timeline>
    </>
  );
};

export { ResourceTimeLine };
