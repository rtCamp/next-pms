import type { TodoPriority, TodoStatus } from "./types";

/** React reads at most this many ToDos, with no paging. */
export const TODO_LIMIT = 500;

export const TODO_STATUSES: TodoStatus[] = ["Open", "Closed", "Cancelled"];
export const TODO_PRIORITIES: TodoPriority[] = ["Low", "Medium", "High"];

export const STATUS_ICON: Record<TodoStatus, string> = {
  Open: "lucide-circle",
  Closed: "lucide-circle-check",
  Cancelled: "lucide-circle-x",
};

export const STATUS_COLOR: Record<TodoStatus, string> = {
  Open: "text-ink-gray-5",
  Closed: "text-ink-gray-8",
  Cancelled: "text-ink-gray-4",
};

export const PRIORITY_DOT: Record<TodoPriority, string> = {
  Low: "bg-surface-green-7",
  Medium: "bg-surface-amber-7",
  High: "bg-surface-red-7",
};
