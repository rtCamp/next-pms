import type { HelpTip } from "./types";

export const PAGE_TIPS: HelpTip[] = [
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
    id: "member-timesheet",
    title: "Review a member's timesheet",
    body: "Select a name in Timesheets to review and approve that member's time in Team Timesheet.",
    roles: ["Timesheet Manager"],
  },
];

export const GENERAL_TIPS: HelpTip[] = [
  {
    id: "search",
    title: "Jump anywhere with search",
    body: "Press Ctrl+K (Cmd+K on Mac) on any page, type part of a page's name and select it.",
    wiki: "Navigation-and-Layout#global-search",
  },
  {
    id: "app-menu",
    title: "Open Settings and the app menu",
    body: "Select Next PMS at the top of the sidebar. Ctrl+Shift+Comma (Cmd+Shift+Comma on Mac) opens Settings directly.",
    wiki: "Navigation-and-Layout#header-menu",
  },
];

export const MANY_TIPS: HelpTip[] = Array.from({ length: 14 }, (_, index) => ({
  id: `tip-${index + 1}`,
  title: `Tip number ${index + 1}`,
  body: "A tip long enough to wrap onto a second line inside the panel.",
}));
