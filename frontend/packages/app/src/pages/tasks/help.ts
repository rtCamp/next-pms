/**
 * External dependencies.
 */
import type { FieldHelp, HelpTip } from "@next-pms/design-system/components";

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

export const TASKS_TIPS: HelpTip[] = [
  {
    id: "add-time-from-task",
    title: "Add time from a task",
    body: "Add time opens with the task's project and task already filled in.",
    steps: [
      "Select the clock at the end of the task's row.",
      "Select the Duration bar for the hours, then drag to fine-tune.",
      "Add a comment and save.",
    ],
    wiki: "Tasks#log-time-on-a-task",
    motion: () => import("@/assets/motions/add-time-from-task?motion"),
  },
  {
    id: "star-task",
    title: "Star the tasks you use often",
    body: "Select the star at the end of a task's row. Starred tasks show near the top of the Task dropdown in Add time.",
    wiki: "Tasks#task-list",
    motion: () => import("@/assets/motions/star-task?motion"),
  },
  {
    id: "task-log",
    title: "Open a task's time log from its subject",
    body: "Select a task's subject to see the time logged on it and how that compares with its expected time.",
    wiki: "Tasks#task-log-dialog",
    roles: ["Projects Manager", "Timesheet Manager"],
    motion: () => import("@/assets/motions/open-task-log?motion"),
  },
];

export const STAR_TASK_TOOLTIP =
  "Star task. Starred tasks show near the top of the Task dropdown in Add time.";
