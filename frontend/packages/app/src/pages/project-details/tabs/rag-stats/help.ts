/**
 * External dependencies.
 */
import type { FieldHelp } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { PROJECT_LIST_HELP } from "@/pages/projects/help";

export const RAG_STATS_HELP = {
  currentStatus: {
    title: "Current Status",
    summary:
      "The project's overall health. It takes the colour of the worst trigger in Status Triggers, and is Green when there are none.",
    legend: [
      {
        label: PROJECT_LIST_HELP.name.legend[0].label,
        sample: "Red",
        className: "font-medium text-ink-red-3",
      },
      {
        label: PROJECT_LIST_HELP.name.legend[1].label,
        sample: "Amber",
        className: "font-medium text-ink-amber-3",
      },
      {
        label: PROJECT_LIST_HELP.name.legend[2].label,
        sample: "Green",
        className: "font-medium text-ink-green-3",
      },
    ],
    details: [
      "Which triggers are checked depends on the project's billing type.",
      PROJECT_LIST_HELP.name.details[1],
      "Shows N/A until the project is checked for the first time.",
    ],
    wiki: "RAG-Statistics#introduction",
  },
} satisfies Record<string, FieldHelp>;

export const APPROXIMATE_DATE_TOOLTIP =
  "Approximate date. Hours and cost triggers are checked in the weekly refresh, so this one may have started up to a week earlier.";
