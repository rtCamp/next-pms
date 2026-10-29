/**
 * External dependencies.
 */
import type { FieldHelp } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { PROJECT_LIST_HELP } from "@/pages/projects/help";

export const PROJECT_ABOUT_HELP = {
  budget: {
    ...PROJECT_LIST_HELP.cost_burn_percent,
    title: "Budget burn",
    summary:
      "What is used so far (left) against the total budget (right), with the forecast for upcoming work added to the bar.",
    details: [
      PROJECT_LIST_HELP.cost_burn_percent.details[0],
      "The total budget is the total of submitted Sales Orders, or the Estimated Cost on a Non-Billable project. It reads Budget not set when there is none.",
      PROJECT_LIST_HELP.cost_burn_percent.details[2],
    ],
    wiki: "Project-Detail#project-summary-details-and-team",
  },
  progress: {
    title: "Progress (hours)",
    summary:
      "The hours logged on the project so far (left) against its hour target (right).",
    details: [
      "Hours logged counts everyone's time on the project, including time that is not approved yet.",
      "The target is Total Hours Purchased on a Retainer project, and Target Hours on any other billing type.",
      "The bar stops at 100% when the hours go past the target.",
    ],
    wiki: "Billing-Types#retainer",
  },
} satisfies Record<string, FieldHelp>;

export const EVERYONE_BADGE_TOOLTIP =
  "Everyone in the organization can see this project. Team members lists only the people added to it.";

export const MEMBER_REMOVE_TOOLTIP = {
  manager: (roles: string[]) =>
    `Pick someone else as ${roles.join(" and ")} first`,
  billingTeam: "Delete their rate in Project rates on the Tracking tab first",
};
