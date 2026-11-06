import type { FieldHelp } from "@/components/InfoHoverCard";
import { PROJECT_LIST_HELP } from "@/pages/projects/help";
import { RAG_COLOUR_CLASS } from "./constants";

export const RAG_STATS_HELP = {
  currentStatus: {
    title: "Current Status",
    summary:
      "The project's overall health. It takes the colour of the worst trigger in Status Triggers, and is Green when there are none.",
    legend: [
      {
        label: PROJECT_LIST_HELP.name.legend[0].label,
        sample: "Red",
        class: `font-medium ${RAG_COLOUR_CLASS.Red}`,
      },
      {
        label: PROJECT_LIST_HELP.name.legend[1].label,
        sample: "Amber",
        class: `font-medium ${RAG_COLOUR_CLASS.Amber}`,
      },
      {
        label: PROJECT_LIST_HELP.name.legend[2].label,
        sample: "Green",
        class: `font-medium ${RAG_COLOUR_CLASS.Green}`,
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
