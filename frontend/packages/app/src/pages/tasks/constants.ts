export const TASK_LIST_PAGE_SIZE = 20;

export const TASK_STATUSES = [
  "Open",
  "Working",
  "Pending Review",
  "Overdue",
  "Completed",
  "Cancelled",
] as const;

export const TASK_STATUS_OPTIONS = TASK_STATUSES.map((status) => ({
  label: status,
  value: status,
}));

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export const TASK_PRIORITY_OPTIONS = TASK_PRIORITIES.map((priority) => ({
  label: priority,
  value: priority,
}));

export const TASK_SORTABLE_FIELDS = [
  { column: "subject", field: "subject", label: "Subject" },
  { column: "project_name", field: "project", label: "Project" },
  { column: "status", field: "status", label: "Status" },
  { column: "expected_time", field: "expected_time", label: "Expected time" },
  { column: "priority", field: "priority", label: "Priority" },
  { column: "exp_end_date", field: "exp_end_date", label: "Due date" },
  { column: "modified", field: "modified", label: "Last updated" },
] as const;
