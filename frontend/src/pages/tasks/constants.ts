export const TASK_LIST_PAGE_SIZE = 20;

/** Statuses offered in the status filter (`Template` is left out, as in the React page). */
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

/** Sort fields; `column` links a field to its list column for the header sort buttons. */
export const TASK_SORTABLE_FIELDS = [
  { column: "subject", field: "subject", label: "Subject" },
  { column: "project_name", field: "project", label: "Project" },
  { column: "status", field: "status", label: "Status" },
  { column: "expected_time", field: "expected_time", label: "Expected time" },
  { column: "priority", field: "priority", label: "Priority" },
  { column: "exp_end_date", field: "exp_end_date", label: "Due date" },
  { column: "modified", field: "modified", label: "Last updated" },
] as const;

export const DEFAULT_TASK_SORT = { field: "modified", order: "desc" } as const;

/** Data columns, in default order; the user can hide and reorder them. */
export const TASK_LIST_COLUMNS = [
  { key: "subject", label: "Subject", width: "280px" },
  { key: "project_name", label: "Project", width: "200px" },
  { key: "status", label: "Status", width: "160px" },
  { key: "expected_time", label: "Expected time", width: "140px" },
  { key: "priority", label: "Priority", width: "120px" },
  { key: "exp_end_date", label: "Due date", width: "140px" },
] as const;

/** Trailing per-row controls; always shown and never offered in the column selector. */
export const TASK_ACTION_COLUMNS = [
  { key: "add_time", label: "", width: "48px" },
  { key: "like", label: "", width: "48px" },
  { key: "actions", label: "", width: "48px" },
] as const;

/** Query param holding the column order; left out when it's the default. */
export const TASK_COLUMN_PARAM = "columnOrder";
