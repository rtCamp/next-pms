/**
 * Internal dependencies.
 */
import { TASK_LIST_HELP } from "../help";
import type { ListViewColumn } from "../types";

export const TASK_LIST_COLUMNS: ListViewColumn[] = [
  { key: "subject", label: "Subject", width: "280px" },
  { key: "project_name", label: "Project", width: "200px" },
  {
    key: "status",
    label: "Status",
    width: "160px",
    help: TASK_LIST_HELP.status,
  },
  { key: "expected_time", label: "Expected time", width: "140px" },
  { key: "priority", label: "Priority", width: "120px" },
  { key: "exp_end_date", label: "Due date", width: "140px" },
];

/** Trailing per-row controls; always shown and never offered in the selector. */
export const TASK_ACTION_COLUMNS: ListViewColumn[] = [
  { key: "add_time", label: "", width: "48px" },
  { key: "like", label: "", width: "48px" },
  { key: "actions", label: "", width: "48px" },
];

export const TASK_COLUMN_PARAM = "columnOrder";
