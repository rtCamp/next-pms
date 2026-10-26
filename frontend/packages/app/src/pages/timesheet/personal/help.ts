/**
 * External dependencies.
 */
import type { FieldHelp, HelpTip } from "@next-pms/design-system/components";

export const PERSONAL_TIMESHEET_TIPS: HelpTip[] = [
  {
    id: "add-time-entry",
    title: "Add a time entry",
    body: "Select Add time, pick the project and task, then click the Duration bar for the hours and drag to fine-tune. Add a comment and save.",
    wiki: "Personal-Timesheet#log-time-with-the-add-time-dialog",
  },
  {
    id: "log-time-inline",
    title: "Log time straight in the grid",
    body: "Hover or click a day's cell on a task row to type hours without opening the dialog. Use Add time when you need the extra options.",
    wiki: "Personal-Timesheet#log-or-edit-time-inline",
  },
  {
    id: "submit-week",
    title: "Send a week for approval",
    body: "When a week is complete, select the send button at the end of its row. Your reporting manager reviews it.",
    wiki: "Personal-Timesheet#submit-a-week-for-approval",
  },
];

const GRID_WIKI = "Personal-Timesheet#the-weeks-grid";

// Day cell samples look like a hovered cell, so they read as cells.
const HOVERED_CELL = "rounded bg-surface-gray-2 px-1.5 py-0.5";

export const PERSONAL_TIMESHEET_HELP = {
  dayCells: {
    title: "Day cells",
    summary:
      "Hours logged on each day. On task rows, the colour of the hours shows the approval status.",
    legend: [
      {
        label: "Approved or partly approved",
        sample: "8:00",
        className: `${HOVERED_CELL} text-ink-green-4`,
      },
      {
        label: "Pending approval or processing",
        sample: "8:00",
        className: `${HOVERED_CELL} text-ink-amber-4`,
      },
      {
        label: "Rejected or partly rejected",
        sample: "8:00",
        className: `${HOVERED_CELL} text-ink-red-4`,
      },
      {
        label: "Not submitted",
        sample: "8:00",
        className: `${HOVERED_CELL} text-ink-gray-8`,
      },
      {
        label: "Non-billable task",
        sample: "8:00",
        className: `${HOVERED_CELL} text-ink-gray-8`,
        marker: "bg-surface-amber-3",
      },
    ],
    details: [
      "A cell is locked when its week is approved, all that day's entries are approved, or the date is past your backdating cut-off.",
    ],
    wiki: GRID_WIKI,
  },
  total: {
    title: "Total",
    summary:
      "Hours logged in the week plus time-off, compared with your weekly working hours.",
    formula: "Hours logged + time-off hours",
    details: [
      "It turns red when it's under your weekly working hours, green when it matches them, and amber when it's over.",
      "Holidays and leave count as working hours, so the total can include hours you didn't log.",
    ],
  },
  timeOff: {
    title: "Time-off",
    summary:
      "Leave and holidays on each day. They count as working hours in the day and week totals.",
    details: [
      "A holiday or a full day of leave counts as your daily working hours. A half day counts as half.",
      "Leave still waiting for approval is shown too.",
      "Greyed cells are holidays. Weekly offs add nothing. Hover a holiday to see its name.",
    ],
    wiki: GRID_WIKI,
  },
  halfDayDate: {
    title: "Half Day Date",
    summary: "The day in your leave that's taken as a half day.",
    details: ["Every other day from From to To counts as a full day."],
    wiki: "Personal-Timesheet#add-time-off",
  },
} satisfies Record<string, FieldHelp>;
