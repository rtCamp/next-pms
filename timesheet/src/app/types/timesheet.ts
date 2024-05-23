export interface TaskData {
  parent: string;
  task: string;
  hours: number;
  name: string;
  description: string;
}
export interface TimesheetProp extends TaskData {
  date: string;
  isUpdate: boolean;
}

export interface Dateprops{
  date: string;
  is_holiday: boolean;
}

export interface dateRangeProps{
  start_date: string;
  end_date: string;
}
