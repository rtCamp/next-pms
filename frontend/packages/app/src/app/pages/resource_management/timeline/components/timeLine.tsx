/**
 * External dependencies.
 */
import { useContext, useState } from "react";
import Timeline, { DateHeader, SidebarHeader, TimelineHeaders } from "react-calendar-timeline";
import { useDispatch, useSelector } from "react-redux";
import { cn, getDayDiff, getMonthYearKey, getTodayDate, getUTCDateTime, prettyDate } from "@next-pms/design-system";
import { TableHead, useToast } from "@next-pms/design-system/components";
import { startOfWeek } from "date-fns";
import { useFrappeCreateDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import moment from "moment";

/**
 * Internal dependencies.
 */
import { RootState } from "@/store";
import { PermissionProps, setResourceFormData } from "@/store/resource_management/allocation";
import { ResourceAllocationProps } from "@/types/resource_management";
import ResourceTimeLineGroup from "./group";
import { ResourceAllocationEmployeeProps, ResourceAllocationTimeLineProps } from "../types";
import { TimeLineDateHeader, TimeLineIntervalHeader } from "./header";
import ResourceTimeLineItem, { ItemAllocationActionDialog } from "./item";
import { TableContext } from "../../store/tableContext";
import { TimeLineContext } from "../../store/timeLineContext";
import { getDayKeyOfMoment } from "../../utils/dates";
import { getFormatedStringValue } from "../../utils/value";

interface ResourceTimeLineProps {
  handleFormSubmit: (oldData: ResourceAllocationTimeLineProps, newData: ResourceAllocationTimeLineProps) => void;
}

const ResourceTimeLine = ({ handleFormSubmit }: ResourceTimeLineProps) => {
  const { tableProperties, getCellWidthString } = useContext(TableContext);
  const {
    employees,
    allocations,
    allocationData,
    getAllocationWithID,
    updateAllocation,
    getEmployeeWithIndex,
    setAllocationData,
    filters,
    getEmployeeWithID,
  } = useContext(TimeLineContext);
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  const dispatch = useDispatch();

  const [showItemAllocationActionDialog, setShowItemAllocationActionDialog] = useState(false);

  const start = startOfWeek(getTodayDate(), {
    weekStartsOn: 1,
  });

  const { createDoc: createAllocations } = useFrappeCreateDoc();
  const { updateDoc: updateAllocations } = useFrappeUpdateDoc();

  const { toast } = useToast();

  const getVerticalLineClassNamesForTime = (startTime: number) => {
    const today = getTodayDate();
    const currentDay = getDayKeyOfMoment(moment(startTime));
    const { day } = prettyDate(getDayKeyOfMoment(moment(startTime)));

    let classNames = ["border-0"];

    if (filters.isShowMonth) {
      const currentMonth = getMonthYearKey(getDayKeyOfMoment(moment(startTime)));
      const nextMonth = getMonthYearKey(getDayKeyOfMoment(moment(startTime).add(-1, "days")));

      if (currentMonth !== nextMonth) {
        return [" border-0 border-r border-gray-300 opacity-80"];
      }

      return classNames;
    }

    if (day == "Sun") {
      classNames = ["border-r border-gray-300 opacity-80"];
    }

    if (currentDay == today) {
      if (day == "Sat") {
        classNames = ["border-l border-gray-300 opacity-80 rct-day-6-today"];
      } else if (day == "Sun") {
        classNames = ["border-l border-gray-300 opacity-80 rct-day-0-today"];
      } else {
        classNames = ["border-l border-r border-gray-300 opacity-80"];
      }
    }

    return classNames;
  };

  const getAllocationApi = (data: ResourceAllocationTimeLineProps) => {
    const doctypeDoc = {
      employee: data.employee,
      project: data.project,
      customer: data.customer,
      total_allocated_hours: data.total_allocated_hours,
      hours_allocated_per_day: data.hours_allocated_per_day,
      allocation_start_date: data.allocation_start_date,
      allocation_end_date: data.allocation_end_date,
      is_billable: data.is_billable ? 1 : 0,
      note: data.note,
    };
    if (data.name) {
      return updateAllocations("Resource Allocation", data.name, doctypeDoc);
    }
    return createAllocations("Resource Allocation", doctypeDoc);
  };

  const updateAllocationApi = (allocation: ResourceAllocationTimeLineProps, needsStateRefresh: boolean = true) => {
    let updatedAllocation = allocation;

    if (needsStateRefresh) {
      updatedAllocation = updateAllocation({
        ...allocation,
      });
    }

    getAllocationApi(updatedAllocation)
      .then(() => {
        if (!needsStateRefresh) {
          handleFormSubmit(
            allocationData.old as ResourceAllocationTimeLineProps,
            allocationData.new as ResourceAllocationTimeLineProps
          );
        }
        toast({
          variant: "success",
          description: "Resouce allocation updated successfully",
        });
      })
      .catch(() => {
        toast({
          variant: "destructive",
          description: "Failed to updated resource allocation",
        });
      });
  };

  const setResourceAllocationData = (resourceAllocation: ResourceAllocationProps) => {
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
        customer_name: resourceAllocation?.customerData ? resourceAllocation?.customerData?.name : "",
        isNeedToEdit: resourceAllocation.name ? true : false,
        name: resourceAllocation.name,
      })
    );
  };

  const onItemMove = (itemId: string, dragTime: number, newGroupOrder: number) => {
    if (!resourceAllocationPermission.write) {
      return;
    }

    const allocation: ResourceAllocationTimeLineProps | undefined = getAllocationWithID(itemId);
    if (!allocation) {
      return;
    }
    const newStartData: string = getDayKeyOfMoment(moment(dragTime));
    const diffOfDays = getDayDiff(allocation.allocation_start_date, allocation.allocation_end_date);
    const newEndData: string = getDayKeyOfMoment(moment(dragTime).add(diffOfDays, "days"));
    const employee: ResourceAllocationEmployeeProps | -1 = getEmployeeWithIndex(newGroupOrder);

    if (employee == -1) {
      return;
    }

    const updatedAllocation = {
      ...allocation,
      allocation_start_date: newStartData,
      allocation_end_date: newEndData,
      start_time: getUTCDateTime(newStartData).getTime(),
      end_time: getUTCDateTime(newEndData).setDate(getUTCDateTime(newEndData).getDate() + 1),
      employee: employee.name,
      employee_name: employee.employee_name,
      group: employee.name,
    };

    if (employee.name !== allocation.employee) {
      setAllocationData({ old: allocation, new: updatedAllocation, isNeedToDelete: false });
      setShowItemAllocationActionDialog(true);
      return;
    }

    updateAllocationApi(updatedAllocation);
  };

  const onCanvasClick = (groupId: string, time: number) => {
    const employee = getEmployeeWithID(groupId);
    const date: string = getDayKeyOfMoment(moment(time));

    setResourceAllocationData({
      name: "",
      employee: employee.name,
      employee_name: employee.employee_name,
      allocation_start_date: date,
      allocation_end_date: date,
      hours_allocated_per_day: 0,
      total_allocated_hours: 0,
      project: "",
      project_name: "",
      customer: "",
      is_billable: 0,
      note: "",
    });
  };

  const onItemResize = (itemId: string, time: number, edge: "left" | "right") => {
    if (!resourceAllocationPermission.write) {
      return;
    }

    const allocation: ResourceAllocationTimeLineProps | undefined = getAllocationWithID(itemId);

    if (!allocation) {
      return;
    }

    let newStartData = "",
      newEndData = "";

    if (edge === "left") {
      newStartData = getDayKeyOfMoment(moment(time));
      newEndData = allocation.allocation_end_date;
    } else {
      newEndData = getDayKeyOfMoment(moment(time));
      newStartData = allocation.allocation_start_date;
    }

    updateAllocationApi({
      ...allocation,
      allocation_start_date: newStartData,
      allocation_end_date: newEndData,
      start_time: getUTCDateTime(newStartData).getTime(),
      end_time: getUTCDateTime(newEndData).setDate(getUTCDateTime(newEndData).getDate() + 1),
    });
  };

  const onItemDoubleClick = (itemId: string) => {
    if (!resourceAllocationPermission.write) {
      return;
    }
    const allocation = getAllocationWithID(itemId);
    setResourceAllocationData(allocation as ResourceAllocationProps);
  };

  if (employees.length == 0) {
    return <></>;
  }

  return (
    <>
      {/* Full ts support is in beta version for now */}
      <Timeline
        groups={employees}
        items={allocations}
        sidebarWidth={tableProperties.firstCellWidth * 16}
        defaultTimeStart={start.getTime()}
        defaultTimeEnd={
          start.getTime() +
          (filters.isShowMonth
            ? moment.duration(3, "months").asMilliseconds()
            : moment.duration(18, "days").asMilliseconds())
        }
        minZoom={
          filters.isShowMonth
            ? moment.duration(3, "months").asMilliseconds()
            : moment.duration(18, "days").asMilliseconds()
        }
        maxZoom={
          filters.isShowMonth
            ? moment.duration(3, "months").asMilliseconds()
            : moment.duration(18, "days").asMilliseconds()
        }
        lineHeight={50}
        itemHeightRatio={0.75}
        canMove={resourceAllocationPermission.write}
        canChangeGroup={resourceAllocationPermission.write}
        itemTouchSendsClick={resourceAllocationPermission.write}
        stackItems={true}
        showCursorLine
        canResize={resourceAllocationPermission.write ? "both" : undefined}
        groupRenderer={ResourceTimeLineGroup}
        itemRenderer={ResourceTimeLineItem}
        verticalLineClassNamesForTime={getVerticalLineClassNamesForTime}
        onItemMove={onItemMove}
        onItemResize={onItemResize}
        onItemDoubleClick={onItemDoubleClick}
        onCanvasClick={onCanvasClick}
        className="overflow-x-auto"
      >
        <TimelineHeaders
          className="bg-slate-50 flex items-center text-[14px] sticky"
          calendarHeaderClassName="border-0 border-l border-gray-300"
        >
          <SidebarHeader>
            {() => {
              return (
                <TableHead
                  className={cn("flex items-center")}
                  style={{ width: getCellWidthString(tableProperties.firstCellWidth - 0.05) }}
                >
                  Members
                </TableHead>
              );
            }}
          </SidebarHeader>
          {filters.isShowMonth ? (
            <>
              <DateHeader
                unit="month"
                intervalRenderer={TimeLineIntervalHeader}
                headerData={{ unit: "month", showYear: true }}
              />
              <DateHeader unit="month" intervalRenderer={TimeLineIntervalHeader} headerData={{ unit: "month" }} />
            </>
          ) : (
            <>
              <DateHeader
                unit="week"
                height={30}
                intervalRenderer={TimeLineIntervalHeader}
                headerData={{ unit: "week" }}
              />
              <DateHeader
                style={{ width: tableProperties.cellWidth }}
                unit="day"
                height={50}
                intervalRenderer={TimeLineDateHeader}
                headerData={{ unit: "day" }}
              />
            </>
          )}
        </TimelineHeaders>
      </Timeline>

      {showItemAllocationActionDialog && (
        <ItemAllocationActionDialog
          handleMove={() => {
            updateAllocationApi(allocationData.new as ResourceAllocationTimeLineProps, false);
            setShowItemAllocationActionDialog(false);
          }}
          handleCopy={() => {
            updateAllocationApi({ ...allocationData.new, name: "" } as ResourceAllocationTimeLineProps, false);
            setShowItemAllocationActionDialog(false);
          }}
          handleCancel={() => {
            setShowItemAllocationActionDialog(false);
          }}
        />
      )}
    </>
  );
};

export { ResourceTimeLine };
