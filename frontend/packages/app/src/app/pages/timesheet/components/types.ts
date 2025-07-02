/**
 * Internal dependencies.
 */
import type { RootState } from "@/store";
import type { UserState } from "@/store/user";
import type { DataProp, TaskDataItemProps } from "@/types/timesheet";

export interface ApprovalProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose?: (data: any) => void;
  user: UserState;
  timesheetState: TimesheetState;
  dispatch: (value: Action) => void;
}

export type TimesheetDetail = Pick<
  TaskDataItemProps,
  "parent" | "name" | "hours" | "description" | "task" | "is_billable"
> & {
  date: string;
};

export interface EditTimeProps {
  employee: string;
  date: string;
  task: string;
  open: boolean;
  onClose: () => void;
  user: UserState;
}

export interface ExpandableHoursProps {
  totalHours: string;
  workingHours: string;
  timeoffHours: string;
}

export type FooterProps = {
  timesheet: TimesheetState;
  user: RootState["user"];
  dispatch: React.Dispatch<Action>;
  callback: () => void;
};

export interface TimesheetState {
  timesheet: {
    name: string;
    task: string;
    date: string;
    description: string;
    hours: number;
    employee: string;
    project?: string;
  };
  dateRange: { start_date: string; end_date: string };

  data: DataProp;
  isDialogOpen: boolean;
  isImportFromGoogleCalendarDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isAprrovalDialogOpen: boolean;
  isLeaveDialogOpen: boolean;
  weekDate: string;
}

export type Action =
  | { type: "SET_DATA"; payload: DataProp }
  | {
      type: "SET_DATE_RANGE";
      payload: { start_date: string; end_date: string };
    }
  | { type: "SET_TIMESHEET"; payload: TimesheetState["timesheet"] }
  | { type: "SET_WEEK_DATE"; payload: string }
  | { type: "SET_DIALOG_STATE"; payload: boolean }
  | { type: "SET_IMPORT_FROM_GOOGLE_CALENDAR_DIALOG_STATE"; payload: boolean }
  | { type: "SET_APPROVAL_DIALOG_STATE"; payload: boolean }
  | { type: "SET_LEAVE_DIALOG_STATE"; payload: boolean }
  | { type: "SET_EDIT_DIALOG_STATE"; payload: boolean }
  | { type: "APPEND_DATA"; payload: DataProp }
  | { type: "RESET_STATE" }
  | { type: "SET_WEEK_DATE"; payload: string };

export interface Event {
  id: string;
  subject: string;
  starts_on: Date;
  ends_on: Date;
  selected: boolean;
  description?: string;
  color?: string;
  owner?: string;
  all_day?: number;
  event_type?: string;
  repeat_this_event?: number;
  repeat_on?: string;
  repeat_till?: Date;
}
