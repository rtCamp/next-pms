/**
 * External dependencies.
 */
import { useContext } from "react";
import Timeline, { DateHeader, SidebarHeader, TimelineHeaders } from "react-calendar-timeline";
import { getTodayDate, getUTCDateTime, prettyDate } from "@next-pms/design-system";
import { TableHead } from "@next-pms/design-system/components";
import { startOfWeek } from "date-fns";
import moment from "moment";

/**
 * Internal dependencies.
 */
import { cn } from "@/lib/utils";
import ResourceTimeLineGroup from "./group";
import { TimeLineDateHeader, TimeLineIntervalHeader } from "./header";
import ResourceTimeLineItem from "./item";
import { TableContext } from "../store/tableContext";
import { TimeLineContext } from "../store/timeLineContext";
import { getDayKeyOfMoment } from "../utils/dates";

const ResourceTimeLine = () => {
  const { tableProperties, getCellWidthString } = useContext(TableContext);
  const { employees, allocations } = useContext(TimeLineContext);

  const start = startOfWeek(getUTCDateTime(getTodayDate()), {
    weekStartsOn: 1,
  });

  const getVerticalLineClassNamesForTime = (startTime: number) => {
    const today = getUTCDateTime(getTodayDate());
    if (startTime == today.getTime()) {
      return ["border-l border-r border-gray-300 opacity-80"];
    }

    const { day } = prettyDate(getDayKeyOfMoment(moment(startTime)));

    if (day == "Sun") {
      return ["border-l border-gray-300 opacity-80"];
    }

    return ["border-0"];
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
        minZoom={18 * 60 * 60 * 1000 * 24}
        maxZoom={18 * 60 * 60 * 1000 * 24}
        lineHeight={50}
        itemHeightRatio={0.75}
        canChangeGroup={true}
        stackItems={true}
        canResize="both"
        groupRenderer={ResourceTimeLineGroup}
        itemRenderer={ResourceTimeLineItem}
        verticalLineClassNamesForTime={getVerticalLineClassNamesForTime}
        className="overflow-x-auto"
      >
        <TimelineHeaders
          className="bg-slate-50 flex items-center text-[14px]"
          calendarHeaderClassName="border-0 border-l border-gray-300"
        >
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
          <DateHeader unit="week" height={30} intervalRenderer={TimeLineIntervalHeader} />
          <DateHeader
            style={{ width: tableProperties.cellWidth }}
            unit="day"
            height={50}
            intervalRenderer={TimeLineDateHeader}
          />
        </TimelineHeaders>
      </Timeline>
    </>
  );
};

export { ResourceTimeLine };
