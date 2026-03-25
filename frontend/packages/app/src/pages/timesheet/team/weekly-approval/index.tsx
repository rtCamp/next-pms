/**
 * External Dependencies
 */
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useFrappeGetCall, useFrappeGetDoc } from "frappe-react-sdk";

/**
 * Internal Dependencies
 */
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
  const [currentView, setCurrentView] = useState<ModalView>("approval");
  const [rejectionTimesheetIds, setRejectionTimesheetIds] = useState<string[]>(
    [],
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

  const { data: employeeData } = useFrappeGetDoc("Employee", employee);

  const employeeName = employeeData?.employee_name || "";
  const avatarUrl = employeeData?.image || "";

  const handleReject = (timesheetIds: string[]) => {
    setRejectionTimesheetIds(timesheetIds);
    setCurrentView("rejection");
  };

  const handleApproveSubmit = (timesheetIds: string[]) => {
    console.log("Approved timesheetIds:", timesheetIds);
    onOpenChange(false);
  };

  const handleRejectionSubmit = (reason: string) => {
    console.log(
      "Rejected timesheetIds:",
      rejectionTimesheetIds,
      "Reason:",
      reason,
    );
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
            onApprove={handleApproveSubmit}
            onReject={handleReject}
          />
        ) : (
          <RejectionPopup
            employeeName={employeeName}
            avatarUrl={avatarUrl}
            timesheetIds={rejectionTimesheetIds}
            onReject={handleRejectionSubmit}
          />
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default WeeklyApproval;
