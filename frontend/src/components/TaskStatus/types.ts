import type { BadgeProps } from "frappe-ui";

export const TASK_STATUSES = [
  "Open",
  "Working",
  "Pending Review",
  "Overdue",
  "Template",
  "Completed",
  "Cancelled",
] as const;

/** A Frappe `Task` status. */
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export interface TaskStatusProps {
  /** Task status to show; an unknown value renders with Open's look. */
  status: TaskStatusValue;
  /** Badge size. */
  size?: BadgeProps["size"];
}
