/**
 * Internal Dependencies
 */
export type ProjectData = {
  name: string;
  project_name: string;
};

export type TaskItem = {
  actual_time: number;
  custom_is_billable: number;
  description: null | string;
  exp_end_date: null | string;
  expected_time: number;
  name: string;
  priority: string;
  project: string;
  project_name: string;
  status: string;
  subject: string;
};

export type TaskListData = {
  has_more: boolean;
  total_count: number;
  task: TaskItem[];
};

export type CalendarEvent = {
  id: string;
  subject: string;
  starts_on: string;
  ends_on: string;
  all_day: number;
  event_type: string;
};

export interface AddTimeProps {
  initialDate: string;
  open: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOpenChange: (data: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (data: any) => void;
  task?: string;
  project?: string;
}
