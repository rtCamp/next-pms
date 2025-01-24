/**
 * External dependencies.
 */
import { useContext } from "react";
import Timeline, { DateHeader, SidebarHeader, TimelineHeaders } from "react-calendar-timeline";
import { useDispatch, useSelector } from "react-redux";
import { getTodayDate, getUTCDateTime, prettyDate } from "@next-pms/design-system";
import { TableHead } from "@next-pms/design-system/components";
import { startOfWeek } from "date-fns";
import moment from "moment";

/**
 * Internal dependencies.
 */
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import { PermissionProps, setResourceFormData } from "@/store/resource_management/allocation";
import ResourceTimeLineGroup from "./group";
import { TimeLineDateHeader, TimeLineIntervalHeader } from "./header";
import ResourceTimeLineItem from "./item";
import { ResourceAllocationTimeLineProps } from "./types";
import { TableContext } from "../store/tableContext";
import { TimeLineContext } from "../store/timeLineContext";
import { getDayKeyOfMoment } from "../utils/dates";
import { getFormatedStringValue } from "../utils/value";

const ResourceTimeLine = () => {
  const { tableProperties, getCellWidthString } = useContext(TableContext);
  const { employees, allocations, getAllocationWithID } = useContext(TimeLineContext);
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  const dispatch = useDispatch();

  const start = startOfWeek(getTodayDate(), {
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

  const setResourceAllocationDate = (resourceAllocation: ResourceAllocationTimeLineProps) => {
    if (!resourceAllocationPermission.write) {
      return;
    }

    dispatch(
      setResourceFormData({
        isShowDialog: true,
        employee: resourceAllocation.employee,
        employee_name: resourceAllocation.employee_name,
        project: resourceAllocation.project,
        allocation_start_date: resourceAllocation.allocation_start_date,
        allocation_end_date: resourceAllocation.allocation_end_date,
        is_billable: resourceAllocation.is_billable == 1,
        customer: resourceAllocation.customer,
        total_allocated_hours: getFormatedStringValue(resourceAllocation.total_allocated_hours),
        hours_allocated_per_day: getFormatedStringValue(resourceAllocation.hours_allocated_per_day),
        note: getFormatedStringValue(resourceAllocation.note),
        project_name: resourceAllocation.project_name,
        customer_name: resourceAllocation.customerData.name,
        isNeedToEdit: false,
        name: resourceAllocation.name,
      })
    );
  };

  const onItemMove = (itemId: string, dragTime: number, newGroupOrder: number) => {
    console.log("onItemMove", itemId, dragTime, newGroupOrder);
  };

  const onItemResize = (itemId: string, time: number, edge: "left" | "right") => {
    console.log("onItemResize", itemId, time, edge);
  };

  const onItemSelect = (itemId: string, e: MouseEvent, time: number) => {
    console.log("onItemSelect", itemId, e, time);
  };

  const onItemClick = (itemId: string, e: MouseEvent, time: number) => {
    console.log("onItemClick", itemId, e, time);
  };

  const onItemDoubleClick = (itemId: string) => {
    const allocation = getAllocationWithID(itemId);
    setResourceAllocationDate(allocation);
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
        onItemMove={onItemMove}
        onItemResize={onItemResize}
        onItemSelect={onItemSelect}
        onItemClick={onItemClick}
        onItemDoubleClick={onItemDoubleClick}
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
