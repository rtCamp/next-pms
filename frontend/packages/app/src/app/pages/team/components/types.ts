/**
 * Internal dependencies.
 */
import { ViewData } from "@/store/view";
import type { Action, TeamState } from "../employee-detail/types";

export interface ApprovalProp {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: (data: any) => void;
  employee: string;
  startDate: string;
  endDate: string;
  isAprrovalDialogOpen: boolean;
}

export interface EmployeeTimesheerTableProps {
  employee: string;
  teamState: TeamState;
}

export type TimesheetRejectionProps = {
  onRejection: () => void;
  dates: Array<string>;
  employee: string;
  disabled: boolean;
  isRejecting: boolean;
  setIsRejecting: React.Dispatch<React.SetStateAction<boolean>>;
};

export interface HeaderProps {
  teamState: TeamState;
  dispatch: React.Dispatch<Action>;
  viewData: ViewData;
}
