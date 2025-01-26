/**
 * External dependencies.
 */
import { useContext, useState } from "react";
import Timeline, { DateHeader, SidebarHeader, TimelineHeaders } from "react-calendar-timeline";
import { useDispatch, useSelector } from "react-redux";
import { getDayDiff, getTodayDate, getUTCDateTime, prettyDate } from "@next-pms/design-system";
import { TableHead, useToast } from "@next-pms/design-system/components";
import { startOfWeek } from "date-fns";
import { useFrappeCreateDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import moment from "moment";

/**
 * Internal dependencies.
 */
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import { PermissionProps, setResourceFormData } from "@/store/resource_management/allocation";
import ResourceTimeLineGroup from "./group";
import { TimeLineDateHeader, TimeLineIntervalHeader } from "./header";
import ResourceTimeLineItem, { ItemAllocationActionDialog } from "./item";
import { ResourceAllocationTimeLineProps } from "./types";
import { TableContext } from "../store/tableContext";
import { TimeLineContext } from "../store/timeLineContext";
import { getDayKeyOfMoment } from "../utils/dates";
import { getFormatedStringValue } from "../utils/value";

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
    const today = getUTCDateTime(getTodayDate());
    if (startTime == today.getTime()) {
      return ["border-l border-r border-gray-200 opacity-80"];
    }

    const { day } = prettyDate(getDayKeyOfMoment(moment(startTime)));

    if (day == "Sun") {
      return ["border-l border-gray-200 opacity-80"];
    }

    return ["border-0"];
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
          handleFormSubmit(allocationData.old, allocationData.new);
        }
        toast({
          variant: "success",
          description: "Resouce allocation updated successfully",
        });
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          description: "Failed to updated resource allocation",
        });
      });
  };

  const setResourceAllocationData = (resourceAllocation: ResourceAllocationTimeLineProps) => {
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
        isNeedToEdit: true,
        name: resourceAllocation.name,
      })
    );
  };

  const onItemMove = (itemId: string, dragTime: number, newGroupOrder: number) => {
    const allocation: ResourceAllocationTimeLineProps = getAllocationWithID(itemId);
    const newStartData: string = getDayKeyOfMoment(moment(dragTime));
    const diffOfDays = getDayDiff(allocation.allocation_start_date, allocation.allocation_end_date);
    const newEndData: string = getDayKeyOfMoment(moment(dragTime).add(diffOfDays, "days"));
    const employee = getEmployeeWithIndex(newGroupOrder);

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

  const onItemResize = (itemId: string, time: number, edge: "left" | "right") => {
    const allocation: ResourceAllocationTimeLineProps = getAllocationWithID(itemId);

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
    const allocation = getAllocationWithID(itemId);
    setResourceAllocationData(allocation);
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

      {showItemAllocationActionDialog && (
        <ItemAllocationActionDialog
          handleMove={() => {
            updateAllocationApi(allocationData.new, false);
            setShowItemAllocationActionDialog(false);
          }}
          handleCopy={() => {
            updateAllocationApi({ ...allocationData.new, name: "" }, false);
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
