import type { TaskStatusValue } from "@/components/TaskStatus";

/** Personal shows only the viewer's own time; team shows everyone who logged time. */
export type TaskLogView = "personal" | "team";

/** Someone who logged time on the task in the selected range. */
export interface TaskWorker {
  employeeId: string;
  employeeName: string;
  image: string | null;
  /** Hours logged in the selected range. */
  totalHours: number;
}

/** One timesheet entry on the task. */
export interface TaskLogEntry {
  /** `YYYY-MM-DD`. */
  date: string;
  employee: TaskWorker;
  /** HTML. */
  description: string;
  hours: number;
}

export interface TaskLogDetails {
  subject: string;
  status: TaskStatusValue;
  projectName?: string;
  /** `YYYY-MM-DD`. */
  dueDate?: string;
  /** GitHub issue link; the title links to it when set. */
  ghLink?: string;
  actualHours: number;
  estimatedHours: number;
  workedBy: TaskWorker[];
}

export interface TaskLogProps {
  /** Which summary to show. */
  view?: TaskLogView;
  /** Task details; `null` while loading or before the first load. */
  details?: TaskLogDetails | null;
  /** Time entries in the selected range, newest first. */
  entries?: TaskLogEntry[];
  /** Shows a spinner instead of the body. */
  loading?: boolean;
}

/** Response of `next_pms.timesheet.api.task.get_task`. */
export interface TaskResponse {
  subject: string;
  status: string;
  project: string | null;
  project_name: string | null;
  expected_time: number | null;
  actual_time: number | null;
  exp_end_date: string;
  gh_link: string;
  worked_by: {
    employee: string;
    employee_name: string;
    image: string | null;
    total_hour: number;
  }[];
}

/** Response of `next_pms.timesheet.api.task.get_task_log`: entries keyed by date. */
export type TaskLogResponse = Record<
  string,
  { employee: string; hours: number; description: string[] }[]
>;
