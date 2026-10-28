import type { FieldHelp } from "@/components/InfoHoverCard";

export const TASK_LOG_HELP = {
  progress: {
    title: "Actual / Est.",
    summary:
      "Hours logged on this task so far, compared with its expected time.",
    formula: "Actual ÷ Est. × 100",
    legend: [
      {
        label: "Over expected time",
        sample: "12:00",
        class: "font-medium text-ink-red-8",
      },
    ],
    details: [
      "Actual counts everyone's time on the task, including time not approved yet, whatever date range is selected.",
      "It shows time used, not work done.",
    ],
    wiki: "Tasks#task-log-dialog",
  },
} satisfies Record<string, FieldHelp>;
