/**
 * External dependencies.
 */
import { useOutletContext } from "react-router-dom";

export type TimesheetOutletContext = {
  openAddTimeDialog: () => void;
  openAddLeaveDialog: () => void;
};

export function useTimesheetOutletContext() {
  return useOutletContext<TimesheetOutletContext>();
}