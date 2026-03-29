/**
 * External dependencies.
 */
import { useOutletContext } from "react-router-dom";

export type TimesheetOutletContext = {
  openAddTimeDialog: (date?: string) => void;
  openAddLeaveDialog: () => void;
  handleApproval: (
    startDate: string,
    endDate: string,
    totalHours: number,
  ) => void;
};

export function useTimesheetOutletContext() {
  return useOutletContext<TimesheetOutletContext>();
}
