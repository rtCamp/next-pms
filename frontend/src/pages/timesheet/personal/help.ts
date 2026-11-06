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
