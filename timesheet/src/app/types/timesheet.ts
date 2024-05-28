import { TimesheetStateProps } from "@/app/reducer/timesheet";

export interface DialogProps{
  dialogState: TimesheetStateProps;
  dispatch: React.Dispatch<{
    type: string;
    payload: any;
  }>
}
