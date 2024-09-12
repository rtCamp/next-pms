import { WorkingFrequency } from "@/types";
export interface TaskProps {
  [key: string]: TaskDataProps;
}
export interface TaskDataProps {
  name: string;
  subject: string;
  project_name: string | null;
  is_billable: boolean;
  data: Array<TaskDataItemProps>;
}

export interface TaskDataItemProps {
  hours: number;
  description: string;
  name: string;
  parent: string;
  is_billable: boolean | number;
  task: string;
  from_time: string;
  to_time?: string;
  docstatus: 0 | 1 | 2;
  subject?: string;
  project_name?: string | null;
}

export interface LeaveProps {
  name: string;
  from_date: string;
  to_date: string;
  status: string;
  half_day: boolean;
  half_day_date: string;
}

export interface DynamicKey {
  [key: string]: timesheet;
}
export interface DataProp {
  working_hour: number;
  working_frequency: WorkingFrequency;
  data: DynamicKey;
  leaves: Array<LeaveProps>;
  holidays: Array<string | HolidayProp>;
}
export interface HolidayProp {
  description: string;
  holiday_date: string;
}
export interface timesheet {
  start_date: string;
  end_date: string;
  key: string;
  dates: string[];
  total_hours: number;
  tasks: TaskProps;
  status: string;
}

export interface NewTimesheetProps {
  name: string;
  parent?: string;
  task: string;
  date: string;
  description: string;
  hours: number;
  employee: string;
}
