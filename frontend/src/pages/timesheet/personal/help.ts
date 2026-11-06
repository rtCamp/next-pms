import type { HelpTip } from "@/components/HelpPanel";
import type { FieldHelp } from "@/components/InfoHoverCard";

const GRID_WIKI = "Personal-Timesheet#the-weeks-grid";

// Day cell samples look like a hovered cell, so they read as cells.
const HOVERED_CELL = "rounded-4 bg-surface-gray-2 px-1.5 py-0.5";

export const PERSONAL_TIMESHEET_HELP = {
  dayCells: {
    title: "Day cells",
    summary:
      "Hours logged on each day. On task rows, the colour of the hours shows the approval status.",
    legend: [
      {
        label: "Approved or partly approved",
        sample: "8:00",
        class: `${HOVERED_CELL} text-ink-green-8`,
      },
      {
        label: "Pending approval or processing",
        sample: "8:00",
        class: `${HOVERED_CELL} text-ink-amber-7`,
      },
      {
        label: "Rejected or partly rejected",
        sample: "8:00",
        class: `${HOVERED_CELL} text-ink-red-7`,
      },
      {
        label: "Not submitted",
        sample: "8:00",
        class: `${HOVERED_CELL} text-ink-gray-8`,
      },
      {
        label: "Non-billable task",
        sample: "8:00",
        class: `${HOVERED_CELL} text-ink-gray-8`,
        marker: "bg-surface-amber-7",
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

export const PERSONAL_TIMESHEET_TIPS: HelpTip[] = [
  {
    id: "add-time-entry",
    title: "Add time to a task",
    body: "Add hours to a task from the Add time dialog.",
    steps: [
      "Select Add time.",
      "Pick the project and task.",
      "Select the Duration bar for the hours, then drag to fine-tune.",
      "Add a comment and save.",
    ],
    wiki: "Personal-Timesheet#log-time-with-the-add-time-dialog",
  },
  {
    id: "add-time-on-day",
    title: "Open Add time on a chosen day",
    body: "Select a day's cell on the Projects / Tasks row to open Add time with that date filled in. On a project row, the project is filled in too.",
    wiki: "Personal-Timesheet#the-weeks-grid",
  },
  {
    id: "log-time-inline",
    title: "Add time straight in the grid",
    body: "Type hours straight into a task row, without opening Add time.",
    steps: [
      "Hover or select a day's cell on a task row.",
      "Select the Duration bar for the hours, then drag to fine-tune.",
      "Add a comment.",
      "Select Save entry, or press Ctrl+Enter (Cmd+Enter on Mac).",
    ],
    wiki: "Personal-Timesheet#log-or-edit-time-inline",
  },
  {
    id: "edit-time-inline",
    title: "Edit or delete an entry in the grid",
    body: "Change or remove an entry without leaving the grid.",
    steps: [
      "Hover a day's cell on a task row.",
      "Hover the entry and select its pencil.",
      "Change the duration or comment and select Save entry.",
      "Or select Delete entry to remove it. There's no confirmation.",
    ],
    wiki: "Personal-Timesheet#log-or-edit-time-inline",
  },
  {
    id: "starred-tasks",
    title: "Add your starred tasks to a week",
    body: "Star the tasks you add time to often, then add them to any week as empty rows. Rows added this way are kept in this browser only.",
    steps: [
      "Hover a task's name and select the star beside it.",
      "In a week, select the star at the start of the Projects / Tasks row.",
    ],
    wiki: "Personal-Timesheet#the-weeks-grid",
  },
  {
    id: "calendar-events",
    title: "Add time from your calendar",
    body: "Pick meetings from your Google Calendar in Add time instead of typing them in.",
    steps: [
      "In Add time, tick Add calendar events. If it's greyed out, select Enable beside it to connect your Google Calendar in Desk.",
      "Pick the events. Duration becomes their combined length and each event is listed in the comment.",
    ],
    wiki: "FAQ-and-Troubleshooting#why-is-add-calendar-events-greyed-out-in-add-time",
  },
  {
    id: "submit-week",
    title: "Send a week for approval",
    body: "Send the week to your reporting manager to review.",
    steps: [
      "Select the send button at the end of the week's row.",
      "Add a note if you like, then select Submit.",
    ],
    wiki: "Personal-Timesheet#submit-a-week-for-approval",
  },
  {
    id: "resubmit-week",
    title: "Resubmit a rejected week",
    body: "On a rejected or partly reviewed week, the send button turns into a cross, or a check when part of it is approved.",
    steps: [
      "Hover the rejected day's cell to read the rejection reason.",
      "Fix the entry, or add the missing time.",
      "Select the cross or check at the end of the week's row, then select Submit.",
    ],
    wiki: "Personal-Timesheet#submit-a-week-for-approval",
  },
];
