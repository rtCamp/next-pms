/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Internal dependencies
 */
import { ViewData } from "@/store/view";
import type { DateProps, DateRange, teamStateActionType } from "@/types/team";

import type {
  NewTimesheetProps,
  DataProp as timesheetDataProps,
} from "@/types/timesheet";

export type EmployeeTimesheetProps = {
  startDateParam: string;
  setStartDateParam: React.Dispatch<React.SetStateAction<string>>;
  teamState: TeamState;
  dispatch: React.Dispatch<Action>;
};

export type HourInputprops = {
  data: NewTimesheetProps;
  employee: string;
  disabled?: boolean;
  className?: string;
  callback: (data: NewTimesheetProps) => void;
};

export type EmployeeDetailHeaderProps = {
  state: TeamState;
  employeeId: string;
  dispatch: React.Dispatch<Action>;
};

export interface TeamState {
  data: dataProps;
  action: teamStateActionType;
  statusFilter: Array<string>;
  status: Array<string>;
  employeeName?: string;
  isDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isAprrovalDialogOpen: boolean;
  weekDate: string;
  employeeWeekDate: string;
  project: Array<string>;
  userGroup: Array<string>;
  pageLength: number;
  reportsTo: string;
  timesheet: {
    name: string;
    parent: string;
    task: string;
    date: string;
    description: string;
    hours: number;
    project?: string;
  };
  hasViewUpdated: boolean;
  timesheetData: timesheetDataProps;
  start: number;
  dateRange: DateRange;
  employee: string;
  hasMore: boolean;
  isLoading: boolean;
  isNeedToFetchDataAfterUpdate: boolean;
}

export interface dataProps {
  data: any;
  dates: DateProps[];
  total_count: number;
  has_more: boolean;
}

// Define action types
export type Action =
  | { type: "SET_DATA"; payload: any }
  | { type: "SET_REFETCH_DATA"; payload: boolean }
  | { type: "SET_EMPLOYEE_NAME"; payload: string }
  | { type: "SET_STATUS_FILTER"; payload: Array<string> }
  | { type: "UPDATE_DATA"; payload: any }
  | { type: "SET_TIMESHEET"; payload: any }
  | { type: "SET_WEEK_DATE"; payload: string }
  | { type: "SET_EMPLOYEE_WEEK_DATE"; payload: string }
  | { type: "SET_PROJECT"; payload: Array<string> }
  | { type: "SET_START"; payload: number }
  | { type: "SET_HAS_MORE"; payload: boolean }
  | {
      type: "SET_DATE_RANGE";
      payload: { dateRange: DateRange; isAprrovalDialogOpen: boolean };
    }
  | { type: "SET_APPROVAL_DIALOG"; payload: boolean }
  | { type: "SET_EDIT_DIALOG"; payload: boolean }
  | { type: "SET_EMPLOYEE"; payload: string }
  | { type: "SET_DIALOG"; payload: boolean }
  | { type: "RESET_STATE" }
  | { type: "RESET_TIMESHEET_DATA_STATE" }
  | { type: "SET_TIMESHEET_DATA"; payload: timesheetDataProps }
  | { type: "UPDATE_TIMESHEET_DATA"; payload: timesheetDataProps }
  | { type: "SET_USER_GROUP"; payload: Array<string> }
  | { type: "SET_REPORTS_TO"; payload: string }
  | { type: "SET_STATUS"; payload: Array<string> }
  | { type: "SET_ACTION"; payload: teamStateActionType }
  | {
      type: "SET_FILTERS";
      payload: {
        project: Array<string>;
        userGroup: Array<string>;
        statusFilter: Array<string>;
        employeeName: string;
        reportsTo: string;
        status: Array<string>;
      };
    }
  | { type: "SET_HAS_VIEW_UPDATED"; payload: boolean };

export interface TeamComponentProps {
  viewData: ViewData;
}
