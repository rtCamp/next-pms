/**
 * External dependencies.
 */
import { useOutletContext } from "react-router-dom";

export type TimesheetOutletContext = {
  openAddTimeDialog: () => void;
  openAddLeaveDialog: () => void;
  handleApproval: (startDate:string, endDate:string) => void;
};

export function useTimesheetOutletContext() {
  return useOutletContext<TimesheetOutletContext>();
}