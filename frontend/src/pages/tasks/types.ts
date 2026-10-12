import type { FilterCondition } from "../../components/Filter";
import type {
  TASK_ACTION_COLUMNS,
  TASK_LIST_COLUMNS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "./constants";

export type TaskListStatus = (typeof TASK_STATUSES)[number];

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type TaskListColumn =
  (typeof TASK_LIST_COLUMNS)[number] | (typeof TASK_ACTION_COLUMNS)[number];

export interface TaskListFilters {
  search: string;
  project: string;
  /** Label of the selected project, kept in the URL so the combobox can show it. */
  projectLabel: string;
  status: TaskListStatus[];
  /** Conditions from the Filter panel. */
  advanced: FilterCondition[];
}

/** A row from `next_pms.timesheet.api.task.get_task_list`. */
export interface TaskListItem {
  name: string;
  subject: string;
  project: string;
  project_name: string | null;
  description: string | null;
  status: string;
  priority: string;
  exp_end_date: string | null;
  actual_time: number;
  expected_time: number;
  custom_is_billable?: boolean;
  /** JSON array of the users who starred the task; `null` when nobody has. */
  _liked_by: string | null;
  owner: string;
}

export interface TaskListResponse {
  task: TaskListItem[];
  total_count: number;
  has_more: boolean;
}
