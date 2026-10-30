/**
 * External dependencies.
 */
import type { FieldHelp, HelpTip } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { PROJECT_LIST_HELP } from "@/pages/projects/help";
import type { TabKey } from "./tabs";
import { CUSTOMIZATION_ROLES } from "./tabs/tracking/constants";

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

export const UPDATE_ACTIONS_TOOLTIP = (author: string) =>
  `Only ${author} or a System Manager can edit or delete this update.`;

export const PROJECT_DETAIL_TIPS: Partial<Record<TabKey, HelpTip[]>> = {
  overview: [
    {
      id: "overview-tab",
      title: "What the Overview tab shows",
      body: "The project's details and key goals, plus its Specifics, Communication, Marketing and Sourcing sections.",
    },
    {
      id: "connect-repository",
      title: "Link the project's GitHub repositories",
      body: "Select + beside Project repository connections at the end of the Overview tab, search for the repository and select Add. The section shows only when your site is connected to GitHub.",
      wiki: "Project-Detail#connect-a-github-repository",
    },
  ],
  calendar: [
    {
      id: "calendar-todo",
      title: "Add a ToDo to a milestone",
      body: "Select + in the ToDos column of a milestone or touchpoint. Add ToDo opens already linked to it.",
      motion: () => import("@/assets/motions/calendar-todo?motion"),
    },
    {
      id: "calendar-tab",
      title: "What the Calendar tab shows",
      body: "The project's milestones and touchpoints as a calendar, a Gantt chart or a list. A milestone spans dates and a touchpoint falls on one date.",
    },
    {
      id: "calendar-create",
      title: "Add a milestone or touchpoint",
      body: "Pick Milestones or Touchpoints above the table and select Create.",
    },
  ],
  tracking: [
    {
      id: "tracking-cards",
      title: "Hide or restore Tracking cards",
      body: "Task completion, Budget burn and Cost burn can be hidden. Each change saves as you make it, for everyone on the project.",
      steps: [
        "Select Edit at the top right of the Tracking tab.",
        "To hide a card, select × on it, then select Remove.",
        "To bring one back, select Add widgets, select Add next to the card, then select Save.",
        "Select Done.",
      ],
      wiki: "Project-Detail#hide-or-restore-a-tracking-card",
      roles: CUSTOMIZATION_ROLES,
      motion: () =>
        import("@/assets/motions/hide-restore-tracking-cards?motion"),
    },
    {
      id: "tracking-tab",
      title: "What the Tracking tab shows",
      body: "The project's value, profit and progress, with Task completion, Budget burn and Cost burn. Its contracts and project rates are listed below.",
    },
  ],
  reports: [
    {
      id: "reports-tab",
      title: "What the Reports tab shows",
      body: "Google Doc reports that sum up the project over a period. Generate Project Report creates a new one.",
    },
  ],
  risks: [
    {
      id: "risk-status",
      title: "Change a risk's status or level with an update",
      body: "Open the risk from the list and select + beside Updates. Pick the new Status or Risk, add a Note and select Add update.",
      wiki: "Project-Detail#change-a-risks-status-or-level",
      motion: () => import("@/assets/motions/change-risk-status?motion"),
    },
    {
      id: "risks-tab",
      title: "What the Risks tab shows",
      body: "The risks logged on the project, each with an owner, a level and a status. A risk's status and level change only through its updates.",
    },
  ],
  growth: [
    {
      id: "growth-status",
      title: "Change an initiative's status with an update",
      body: "Open the initiative from the list and select + beside Updates. Set the new Status, Priority for Client or Billable outcome, add a Note and select Add update.",
      motion: () => import("@/assets/motions/change-growth-status?motion"),
    },
    {
      id: "growth-tab",
      title: "What the Growth tab shows",
      body: "Ideas to grow the account, such as upsells and expansions, each with an owner to drive it. Post updates as an idea moves along until it closes.",
    },
    {
      id: "growth-action-item",
      title: "Add an action item to an initiative",
      body: "Open the initiative and select + beside Action items. Add ToDo opens already linked to it, and the ToDo also shows on the ToDos tab.",
    },
  ],
  notes: [
    {
      id: "note-templates",
      title: "Start a note from a saved template",
      body: "Select Create, then New from template, pick a template and select Use template. To save your own, select Create, then Create template.",
      wiki: "Project-Detail#write-a-note",
      motion: () => import("@/assets/motions/note-from-template?motion"),
    },
    {
      id: "notes-tab",
      title: "What the Notes tab shows",
      body: "Notes the team writes on the project. Select Subscribe to get an email when someone else posts a new one.",
    },
  ],
  email: [
    {
      id: "email-tab",
      title: "What the Email tab shows",
      body: "Emails sent or received on the project's form in Desk, plus linked Gmail threads when your site has the Gmail integration. Mail can't be sent from here.",
      wiki: "Integrations#project-email-tab",
    },
  ],
  "to-do": [
    {
      id: "link-todo",
      title: "Link a ToDo",
      body: "In Add ToDo, pick a record under Link to milestone, touchpoint or growth initiative. The ToDo then also shows in the ToDos column on the Calendar tab, or under Action items on the growth initiative.",
      motion: () => import("@/assets/motions/link-todo?motion"),
    },
    {
      id: "to-do-tab",
      title: "What the ToDos tab shows",
      body: "The project's ToDos with their dates, priority and status. A ToDo can link to a milestone, touchpoint or growth initiative.",
    },
  ],
  feedback: [
    {
      id: "feedback-tab",
      title: "What the Feedback tab shows",
      body: "Client feedback shows the client's score for each month, out of 100. Team feedback lists the client's ratings of each team member.",
    },
    {
      id: "schedule-feedback",
      title: "Ask the client for feedback from Desk",
      body: "A Customer Feedback Schedule is set up per customer and covers all their projects. The client gets the form only after the schedule is submitted and sent.",
      steps: [
        "Select Schedule Feedback. Customer Feedback Schedule opens in Desk in a new tab.",
        "Add a schedule with the project's Customer, Feedback Type set to Project, the client contact in Feedback By, the dates and an Email Template.",
        "Submit it, then select Send Feedback Request to email the feedback form.",
      ],
      wiki: "Feedback#set-up-feedback-collection",
      roles: ["System Manager"],
    },
  ],
  "rag-stats": [
    {
      id: "rag-stats-tab",
      title: "What the RAG stats tab shows",
      body: "The project's health. Current Status takes the colour of its worst open trigger, and Status History keeps the triggers that have cleared.",
    },
    {
      id: "clear-rag-trigger",
      title: "Fix the cause to clear a trigger",
      body: "The status can't be changed by hand. Fix what the Alert describes, and the next refresh moves the trigger to Status History with a Clear Date.",
      wiki: "RAG-Statistics#clear-a-trigger",
    },
  ],
};
