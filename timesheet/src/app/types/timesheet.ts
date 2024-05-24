import { TimesheetStateProps } from "@/app/reducer/timesheet";

export interface Dateprops{
  date: string;
  is_holiday: boolean;
}

export interface DialogProps{
  dialogState: TimesheetStateProps;
  dispatch: React.Dispatch<{
    type: string;
    payload: any;
  }>
}
