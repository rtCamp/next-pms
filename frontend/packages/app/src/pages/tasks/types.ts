import type { FilterCondition } from "@rtcamp/frappe-ui-react";

import { TASK_PRIORITIES, TASK_STATUSES } from "./constants";

export type ListViewColumn = { key: string; label: string; width?: string };

export type TaskStatus = (typeof TASK_STATUSES)[number];

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface TaskListFilters {
  search: string;
  project: string;
  status: TaskStatus[];
  advanced: FilterCondition[];
}
