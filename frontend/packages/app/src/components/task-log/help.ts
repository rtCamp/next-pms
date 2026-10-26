/**
 * External dependencies.
 */
import type { FieldHelp } from "@next-pms/design-system/components";

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
        className: "font-medium text-ink-red-4",
      },
    ],
    details: [
      "Actual counts everyone's time on the task, including time not approved yet, whatever date range is selected.",
      "It shows time used, not work done.",
    ],
    wiki: "Tasks#task-log-dialog",
  },
} satisfies Record<string, FieldHelp>;
