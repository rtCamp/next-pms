import type { FieldHelp } from "@/components/InfoHoverCard";

export const TASK_LIST_HELP = {
  status: {
    title: "Status",
    summary:
      "Where the task stands. A task that isn't Completed or Cancelled becomes Overdue after its due date.",
    details: [
      "Overdue is checked once a day, so a task can keep its old status for up to a day after the due date.",
      "Logging time on an Open task changes it to Working.",
    ],
    wiki: "Tasks#task-list",
  },
} satisfies Record<string, FieldHelp>;

export const STAR_TASK_TOOLTIP =
  "Star task. Starred tasks show near the top of the Task dropdown in Add time.";
