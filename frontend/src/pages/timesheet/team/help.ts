import type { FieldHelp } from "@/components/InfoHoverCard";
import { PERSONAL_TIMESHEET_HELP } from "@/pages/timesheet/personal/help";

const GRID_WIKI = "Team-Timesheet#the-members-grid";

export const TEAM_TIMESHEET_HELP = {
  dayCells: {
    ...PERSONAL_TIMESHEET_HELP.dayCells,
    details: [
      "Cells lock when the member's week is approved or the date is past the backdating cut-off.",
      "A task cell also locks while the week is processing, or once all that day's entries are approved.",
    ],
    wiki: GRID_WIKI,
  },
  total: {
    ...PERSONAL_TIMESHEET_HELP.total,
    summary:
      "Hours the member logged in the week plus time-off, compared with their weekly working hours.",
    details: [
      "It turns red when it's under the member's weekly working hours, green when it matches them, and amber when it's over.",
      "Holidays and leave count as working hours, so the total can include hours the member didn't log.",
    ],
  },
  timeOff: {
    ...PERSONAL_TIMESHEET_HELP.timeOff,
    summary:
      "The member's leave and holidays on each day. They count as working hours in the day and week totals.",
    details: [
      "A holiday or a full day of leave counts as the member's daily working hours. A half day counts as half.",
      "Leave still waiting for approval is shown too.",
      "Greyed cells are holidays. Weekly offs add nothing. Hover a holiday to see its name.",
    ],
    wiki: GRID_WIKI,
  },
  reportsTo: {
    title: "Reports to",
    summary: "Lists only the direct reports of the person picked here.",
    details: [
      "The sidebar, the view switcher and search open the page with it set to you.",
      "Select All to see everyone.",
    ],
    wiki: "Team-Timesheet#toolbar",
  },
} satisfies Record<string, FieldHelp>;

export const DECIDED_DAY_TOOLTIP =
  "Every entry on this day is already approved, rejected or processing.";

export const DECIDED_ENTRY_TOOLTIP =
  "This entry is already approved, rejected or processing.";

export const EDIT_ENTRY_TOOLTIP =
  "Correct the duration or comment before you decide.";
