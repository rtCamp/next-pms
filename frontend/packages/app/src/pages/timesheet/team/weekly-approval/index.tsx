/**
 * External Dependencies
 */
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  FrappeError,
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal Dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import ApprovalPopup from "./approval-popup";
import RejectionPopup from "./rejection-popup";
import type { WeeklyApprovalProps } from "./types";
import { convertTimesheetToEntries, type TimesheetEntry } from "../../utils";

type ModalView = "approval" | "rejection";

interface GroupedDay {
  day: string;
  totalHours: number;
  entries: TimesheetEntry[];
}

/**
 * Groups entries by day and calculates total hours per day
 */
const groupEntriesByDay = (entries: TimesheetEntry[]): GroupedDay[] => {
  const grouped = entries.reduce<Record<string, GroupedDay>>((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = {
        day: entry.day,
        totalHours: 0,
        entries: [],
      };
    }
    acc[entry.day].totalHours += entry.hours;
    acc[entry.day].entries.push(entry);
    return acc;
  }, {});

  return Object.values(grouped);
};

const WeeklyApproval = ({
  employee,
  startDate,
  open,
  onOpenChange,
}: WeeklyApprovalProps) => {
  const toast = useToasts();
  const [currentView, setCurrentView] = useState<ModalView>("approval");
  const [checkedDays, setCheckedDays] = useState<Set<string>>(new Set());

  const { call: updateTimesheet } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.update_timesheet_detail",
  );

  const { call: approveOrRejectTimesheet } = useFrappePostCall(
    "next_pms.timesheet.api.team.approve_or_reject_timesheet",
  );

  const { isLoading, data } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    {
      employee: employee,
      start_date: startDate,
      max_week: 1,
    },
  );

  const timesheetData = convertTimesheetToEntries(data);
  const groupedByDay = groupEntriesByDay(timesheetData.entries);
  const totalHours = timesheetData.totalHours;
  const dateRange = timesheetData.dateRange;

  // Initialize checkedDays with all days when data loads
  if (checkedDays.size === 0 && groupedByDay.length > 0) {
    setCheckedDays(new Set(groupedByDay.map((dayGroup) => dayGroup.day)));
  }

  const { data: employeeData } = useFrappeGetDoc("Employee", employee);

  const employeeName = employeeData?.employee_name || "";
  const avatarUrl = employeeData?.image || "";

  const handleDayCheckChange = (day: string, checked: boolean) => {
    setCheckedDays((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(day);
      } else {
        newSet.delete(day);
      }
      return newSet;
    });
  };

  const getCheckedDates = () => {
    return groupedByDay
      .filter((dayGroup) => checkedDays.has(dayGroup.day))
      .map((dayGroup) => dayGroup.entries[0].date);
  };

  const handleReject = () => {
    setCurrentView("rejection");
  };

  const handleTimesheetUpdate = async (
    timesheetId: string,
    taskId: string,
    description: string,
    hours: number,
    parent: string,
    day: string,
  ) => {
    try {
      const res = await updateTimesheet({
        name: timesheetId,
        task: taskId,
        date: day,
        parent,
        description,
        hours,
        employee,
      });
      toast.success(res.message);
    } catch (error) {
      const message = parseFrappeErrorMsg(error as FrappeError);
      toast.error(message);
    }
  };

  const handleApproveSubmit = async () => {
    const dates = getCheckedDates();
    try {
      const res = await approveOrRejectTimesheet({
        dates,
        status: "Approved",
        employee,
      });
      toast.success(res.message);
    } catch (error) {
      const message = parseFrappeErrorMsg(error as FrappeError);
      toast.error(message);
    }
    onOpenChange(false);
  };

  const handleRejectionSubmit = async (reason: string) => {
    const dates = getCheckedDates();
    try {
      const res = await approveOrRejectTimesheet({
        dates,
        status: "Rejected",
        employee,
        note: reason,
      });
      toast.success(res.message);
    } catch (error) {
      const message = parseFrappeErrorMsg(error as FrappeError);
      toast.error(message);
    }
    onOpenChange(false);
  };

  if (isLoading) {
    return <></>;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100" />
        {currentView === "approval" ? (
          <ApprovalPopup
            employeeName={employeeName}
            avatarUrl={avatarUrl}
            dateRange={dateRange}
            totalHours={totalHours}
            groupedByDay={groupedByDay}
            checkedDays={checkedDays}
            onDayCheckChange={handleDayCheckChange}
            onTimesheetUpdate={handleTimesheetUpdate}
            onApprove={handleApproveSubmit}
            onReject={handleReject}
          />
        ) : (
          <RejectionPopup
            employeeName={employeeName}
            avatarUrl={avatarUrl}
            onReject={handleRejectionSubmit}
          />
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default WeeklyApproval;
