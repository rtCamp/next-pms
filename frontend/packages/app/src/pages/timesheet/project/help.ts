/**
 * External dependencies.
 */
import type { FieldHelp, HelpTip } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { PERSONAL_TIMESHEET_HELP } from "@/pages/timesheet/personal/help";

const ROLLUP_WIKI = "Project-Timesheet#the-rollup-table";

export const PROJECT_TIMESHEET_HELP = {
  dayCells: {
    ...PERSONAL_TIMESHEET_HELP.dayCells,
    details: [
      "Member and task cells lock when the member's week is approved or the date is past the backdating cut-off.",
      "A task cell also locks while the week is processing, or once all that day's entries are approved.",
    ],
    wiki: ROLLUP_WIKI,
  },
  total: {
    title: "Total",
    summary: "For a project, the hours logged on it this week.",
    wiki: ROLLUP_WIKI,
  },
  timeOff: {
    ...PERSONAL_TIMESHEET_HELP.timeOff,
    summary:
      "The member's leave and holidays on each day. They add to the member's hours, not the project's.",
    details: [
      "A holiday or a full day of leave counts as the member's daily working hours. A half day counts as half.",
      "Leave still waiting for approval is shown too.",
      "Greyed cells are holidays. Weekly offs add nothing. Hover a holiday to see its name.",
    ],
    wiki: ROLLUP_WIKI,
  },
} satisfies Record<string, FieldHelp>;

export const PROJECT_TIMESHEET_TIPS: HelpTip[] = [
  {
    id: "approve-project-time",
    title: "Approve time on a project",
    body: "Approve only the time a member logged on this project. Their other projects that week stay as they are.",
    steps: [
      "Select the status icon at the end of the member's row, under the project.",
      "Select Approve.",
    ],
    wiki: ROLLUP_WIKI,
    motion: () => import("@/assets/motions/approve-project-time?motion"),
  },
  {
    id: "reject-project-time",
    title: "Reject time on a project",
    body: "Send a member's time on this project back with a reason. Their other projects that week stay as they are.",
    steps: [
      "Select the status icon at the end of the member's row, under the project.",
      "Select Reject.",
      "Enter the reason and select Reject timesheet.",
    ],
    wiki: ROLLUP_WIKI,
    motion: () => import("@/assets/motions/reject-project-time?motion"),
  },
];
