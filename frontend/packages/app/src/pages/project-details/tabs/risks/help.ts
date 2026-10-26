/**
 * External dependencies.
 */
import type { FieldHelp } from "@next-pms/design-system/components";

export const RISKS_HELP = {
  owners: {
    title: "Risk owner and Owner",
    summary:
      "Risk owner is the person responsible for handling the risk. Owner is the person who logged it.",
    wiki: "Project-Detail#toolbar-and-register",
  },
  riskOwner: {
    title: "Risk owner",
    summary: "The person responsible for handling this risk.",
    details: [
      "They get a notification and an email when someone else assigns the risk to them.",
      "A Projects User can edit the risk and post updates only while they are its Risk owner.",
      "If you leave it empty, the project's Project Manager becomes the Risk owner when you save.",
    ],
    wiki: "Project-Detail#create-risk",
  },
  updates: {
    title: "Updates",
    summary:
      "A log of how this risk changed over time. The risk's current status and level come from its latest update.",
    details: [
      "People following the risk get a notification when its status changes.",
    ],
    wiki: "Project-Detail#change-a-risks-status-or-level",
  },
} satisfies Record<string, FieldHelp>;

export const RISK_OWNER_TOOLTIP =
  "The person responsible for handling this risk.";

export const OWNER_TOOLTIP = "The person who logged this risk.";

export const UPDATE_ACTIONS_TOOLTIP = (author: string) =>
  `Only ${author} or a System Manager can edit or delete this update.`;
