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

/** `badge` shows a labelled pill; `icon` shows only the status icon. */
export type TaskStatusVariant = "badge" | "icon";

export interface TaskStatusIcon {
  /** `lucide-*` class icon. */
  icon: string;
  /** `text-ink-*` colour class. */
  color: string;
}

export interface TaskStatusProps {
  /** Task status to show; an unknown value renders with Open's look. */
  status: TaskStatusValue;
  /** Labelled badge or icon only. */
  variant?: TaskStatusVariant;
  /** Badge size; ignored by the icon variant. */
  size?: BadgeProps["size"];
}
