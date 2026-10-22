/**
 * External dependencies.
 */
import type { FieldHelp } from "@next-pms/design-system/components";

const SYSTEM_TIMESHEETS_WIKI = "Settings#system-timesheets";
const SYSTEM_RESOURCE_WIKI = "Settings#system-resource-management";

export const SETTINGS_HELP = {
  expandedWeeks: {
    title: "Default Expanded Weeks in Timesheet View",
    summary:
      "How many of the most recent weeks open expanded in the Personal, Team and Project timesheets.",
    details: [
      "While Use system default is ticked, the organisation-wide value applies.",
      "You can choose up to 12 weeks.",
    ],
    wiki: "Settings#timesheets",
  },
  backdatedEntries: {
    title: "Allow Backdated Entries",
    summary:
      "Lets people log time on past dates, up to a set number of working days before today.",
    details: [
      "When off, past dates are locked.",
      "The Employee limit applies to people logging their own time. The Manager limit applies when someone with a Projects or HR role edits another person's time.",
      "Working days skip holidays, weekly offs and leave. Exempted roles have no limit.",
    ],
    wiki: SYSTEM_TIMESHEETS_WIKI,
  },
  allowedDepartments: {
    title: "Allowed Departments",
    summary:
      "Only people in these departments get the daily and weekly reminder emails.",
    details: [
      "The daily reminder goes to anyone who logged less than their daily hours yesterday. Holidays and full-day leave are skipped.",
      "The weekly reminder goes only to Projects Managers in these departments.",
      "Approval request reminders aren't limited by department.",
    ],
    wiki: SYSTEM_TIMESHEETS_WIKI,
  },
  defaultCurrency: {
    title: "Default Currency",
    summary:
      "The currency employee hourly rates show in on the Team and Project allocations pages.",
    details: [
      "Rates in other currencies are converted at today's exchange rate.",
      "Left empty, rates show in USD.",
    ],
    wiki: SYSTEM_RESOURCE_WIKI,
  },
  missingAllocationReminder: {
    title: "Send Missing Allocation Reminder",
    summary:
      "On the Remind On day, managers get an email listing direct reports who have unbooked days next week.",
    details: [
      "A weekday counts as unbooked when it has no booking and no leave. Tentative bookings count as booked.",
      "Only people with the selected Designations are checked. With none selected, no email is sent.",
    ],
    wiki: SYSTEM_RESOURCE_WIKI,
  },
} satisfies Record<string, FieldHelp>;
