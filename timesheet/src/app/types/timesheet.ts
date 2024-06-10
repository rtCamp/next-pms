import { TimesheetStateProps } from "@/app/reducer/timesheet";

export interface DialogProps {
  dialogState: TimesheetStateProps;
  dispatch: React.Dispatch<{
    type: string;
    payload: any;
  }>
}

export interface TaskCellClickProps {
  date: string,
  name?: string,
  parent?: string,
  task?: any,
  description: string,
  hours: number
}
