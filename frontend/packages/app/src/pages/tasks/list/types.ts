export type TaskListItem = {
  name: string;
  subject: string;
  project: string;
  project_name: string | null;
  status: string;
  priority: string;
  exp_end_date: string | null;
  actual_time: number;
  expected_time: number;
  custom_is_billable?: boolean;
  _liked_by: string;
};

export type ResponseTaskList = {
  message: {
    task: TaskListItem[];
    total_count: number;
    has_more: boolean;
  };
};
