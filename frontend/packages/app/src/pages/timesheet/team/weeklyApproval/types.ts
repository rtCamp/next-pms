import { TaskStatusType } from "@next-pms/design-system/components";


export type ModalView = "approval" | "rejection";

export type WeeklyApprovalProps = {
  employee: string;
  startDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export interface GroupedDay {
  day: string;
  totalHours: number;
  entries: TimesheetEntry[];
}

export interface TimesheetEntry {
  timesheetId: string;
  taskId: string;
  taskName: string;
  projectId: string;
  projectName: string;
  hours: number;
  description: string;
  day: string;
  date: string;
  parent: string;
  status: TaskStatusType;
}

export interface TaskDataEntry {
  name: string;
  from_time: string;
  to_time: string;
  description: string;
  project: string;
  task: string;
  project_name: string;
  is_billable: number;
  hours: number;
  parent: string;
  docstatus: number;
}

export interface Task {
  name: string;
  subject: string;
  data: TaskDataEntry[];
  is_billable: number;
  project_name: string;
  project: string;
  expected_time: number;
  actual_time: number;
  status: string;
  _liked_by: string | null;
  exp_end_date: string;
}

export interface WeekData {
  start_date: string;
  end_date: string;
  key: string;
  dates: string[];
  total_hours: number;
  tasks: Record<string, Task>;
  status: string;
}

export interface TimesheetApiResponse {
  message: {
    working_hour: number;
    working_frequency: string;
    leaves: unknown[];
    holidays: unknown[];
    data: Record<string, WeekData>;
  };
}
