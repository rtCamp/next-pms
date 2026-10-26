/**
 * External dependencies.
 */
import type { FieldHelp } from "@next-pms/design-system/components";

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
