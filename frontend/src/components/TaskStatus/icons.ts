import type { TaskStatusIcon, TaskStatusValue } from "./types";

export const TASK_STATUS_ICONS: Record<TaskStatusValue, TaskStatusIcon> = {
  Open: { icon: "lucide-circle", color: "text-ink-gray-3" },
  Working: { icon: "lucide-loader", color: "text-ink-gray-8" },
  "Pending Review": {
    icon: "lucide-clipboard-clock",
    color: "text-ink-gray-8",
  },
  Overdue: { icon: "lucide-timer", color: "text-ink-red-4" },
  Template: { icon: "lucide-circle", color: "text-ink-gray-8" },
  Completed: { icon: "lucide-circle-check-big", color: "text-ink-gray-8" },
  Cancelled: { icon: "lucide-circle-x", color: "text-ink-gray-8" },
};
