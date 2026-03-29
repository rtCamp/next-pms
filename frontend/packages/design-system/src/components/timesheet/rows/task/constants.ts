export type TaskRowTimeEntry = {
  time: string;
  nonBillable?: boolean;
  disabled?: boolean;
};

export type TaskData = {
  name: string;
  subject: string;
  project_name: string | null;
  is_billable: boolean;
  project: string;
  expected_time: number;
  actual_time: number;
  status: string;
};
