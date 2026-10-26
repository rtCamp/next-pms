/**
 * External dependencies.
 */
import type { FieldHelp } from "@next-pms/design-system/components";

export const GROWTH_HELP = {
  owners: {
    title: "Activity owner and Ideation owner",
    summary:
      "Activity owner is the person responsible for driving the initiative. Ideation owner is the person who came up with the idea.",
  },
  activityOwner: {
    title: "Activity owner",
    summary: "The person responsible for driving this initiative.",
    details: [
      "They get a notification and an email when someone else assigns the initiative to them.",
      "A Projects User can edit the initiative and post updates only while they are its Activity owner.",
    ],
  },
  closedStatus: {
    title: "Closed Status",
    summary: "How the initiative ended, such as Won, Lost or Not Pursued.",
    details: [
      "An initiative moves to this group when its status is set to Closed. You then pick how it ended.",
    ],
  },
  billableOutcome: {
    title: "Billable outcome",
    summary:
      "The revenue you expect this initiative to bring in, in the project's currency.",
  },
  updates: {
    title: "Updates",
    summary:
      "A log of how this initiative changed over time. Its current status, priority and billable outcome come from its latest update.",
    details: [
      "People following the initiative get a notification when its status changes.",
    ],
  },
} satisfies Record<string, FieldHelp>;

export const ACTIVITY_OWNER_TOOLTIP =
  "The person responsible for driving this initiative.";

export const IDEATION_OWNER_TOOLTIP =
  "The person who came up with this initiative.";
