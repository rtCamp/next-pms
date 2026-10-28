/**
 * External dependencies.
 */
import type { FieldHelp, HelpTip } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
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

export const REVIEW_WEEK_STEPS = [
  "Select the status icon at the end of the member's row. Weeks that are Not submitted don't have one.",
  "Untick any day you want to leave out of the decision.",
  "Select Approve, or select Reject and give a reason.",
];

export const TEAM_TIMESHEET_TIPS: HelpTip[] = [
  {
    id: "approve-week",
    title: "Approve a week",
    body: "Approve a member's submitted week. Every day still waiting for a decision starts ticked.",
    steps: [
      "Select the status icon at the end of the member's row. Weeks that are Not submitted don't have one.",
      "Select Approve.",
    ],
    wiki: "Team-Timesheet#approve-a-week",
    motion: () => import("@/assets/motions/approve-week?motion"),
  },
  {
    id: "approve-part-of-week",
    title: "Approve part of a week",
    body: "Only the ticked days are approved or rejected, so you can approve part of a week and reject the rest afterwards.",
    steps: REVIEW_WEEK_STEPS,
    wiki: "Team-Timesheet#approve-a-week",
    motion: () => import("@/assets/motions/approve-part-of-week?motion"),
  },
  {
    id: "reject-week",
    title: "Reject a week",
    body: "Send a submitted week back to the member with a reason, so they can fix it and resubmit.",
    steps: [
      "Select the status icon at the end of the member's row.",
      "Select Reject.",
      "Enter the reason and select Reject timesheet.",
    ],
    wiki: "Team-Timesheet#approve-a-week",
    motion: () => import("@/assets/motions/reject-week?motion"),
  },
];
