/**
 * External dependencies.
 */
import { useOutletContext } from "react-router-dom";

export type OpenAddTimeDialogOptions = {
  date?: string;
  project?: string;
  projectLabel?: string;
  task?: string;
  taskLabel?: string;
  employeeId?: string;
  employeeLabel?: string;
};

export type TimesheetOutletContext = {
  openAddTimeDialog: (prefill?: OpenAddTimeDialogOptions) => void;
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
