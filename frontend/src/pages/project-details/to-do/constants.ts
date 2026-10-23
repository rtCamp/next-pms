import type {
  KnownTodoStatus,
  LinkedRecordType,
  TodoPriority,
  TodoStatus,
} from "./types";

export const TODO_API = "/api/v2/method/next_pms.next_projects.api.todo";

/** React reads at most this many ToDos, with no paging. */
export const TODO_LIMIT = 500;

/** How long after a local write its own realtime echo is still skipped. */
export const OWN_WRITE_ECHO_MS = 10_000;

/** The stock ToDo statuses, used when the boot data has no status options. */
export const DEFAULT_TODO_STATUSES: TodoStatus[] = [
  "Open",
  "Closed",
  "Cancelled",
];
export const TODO_PRIORITIES: TodoPriority[] = ["Low", "Medium", "High"];

export const STATUS_ICON: Record<KnownTodoStatus, string> = {
  Open: "lucide-circle",
  Backlog: "lucide-circle-dashed",
  "In Progress": "lucide-circle-dot",
  Closed: "lucide-circle-check",
  Cancelled: "lucide-circle-x",
};

export const STATUS_COLOR: Record<KnownTodoStatus, string> = {
  Open: "text-ink-gray-5",
  Backlog: "text-ink-gray-4",
  "In Progress": "text-ink-blue-8",
  Closed: "text-ink-gray-8",
  Cancelled: "text-ink-gray-4",
};

/** The row's done / reopen button darkens on hover, except for Closed and Cancelled. */
export const STATUS_HOVER_COLOR: Partial<Record<KnownTodoStatus, string>> = {
  Open: "hover:text-ink-gray-8",
  Backlog: "hover:text-ink-gray-7",
  "In Progress": "hover:text-ink-blue-6",
};

export const PRIORITY_DOT: Record<TodoPriority, string> = {
  Low: "bg-surface-green-7",
  Medium: "bg-surface-amber-7",
  High: "bg-surface-red-7",
};

export const LINKED_RECORD_ICON: Record<LinkedRecordType, string> = {
  Milestone: "lucide-sparkle",
  Touchpoint: "lucide-zap",
  "Growth Initiative": "lucide-leaf",
};

/** The "Linked to" field's option groups, in order. */
export const LINKED_RECORD_GROUPS: { type: LinkedRecordType; label: string }[] =
  [
    { type: "Milestone", label: "Milestones" },
    { type: "Touchpoint", label: "Touchpoints" },
    { type: "Growth Initiative", label: "Growth initiatives" },
  ];

/** The Growth tab's query param naming the initiative it opens (React's `GROWTH_DETAIL_PARAM`). */
export const GROWTH_DETAIL_PARAM = "growth";
