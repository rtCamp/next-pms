/**
 * External dependencies.
 */
import type { FieldHelp } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { STATUS_ICONS } from "./widget/timesheet-summary/statusIcon";

const KPI_WIKI = "Leadership-Dashboard#key-performance-indicators";

export const LEADERSHIP_KPI_HELP = {
  revenue: {
    title: "Revenue",
    summary: "What clients were invoiced in the selected month, in USD.",
    formula: "Sum of submitted sales invoices dated in the month, with taxes.",
    details: [
      "Only invoices linked to a project count. Credit notes reduce the total.",
      "Other currencies are converted at the rate on the invoice date.",
      "Can be up to 6 hours old.",
    ],
    wiki: KPI_WIKI,
  },
  cost: {
    title: "Cost",
    summary:
      "What the time logged on projects in the selected month cost, in USD.",
    formula: "Hours × each person's hourly cost.",
    details: [
      "Hourly cost = CTC ÷ 12 ÷ monthly working hours, using the CTC in effect on the timesheet date.",
      "Draft and submitted timesheets count. Other currencies are converted at the rate on the entry date.",
      "Can be up to 6 hours old.",
    ],
    wiki: KPI_WIKI,
  },
  profit_margin: {
    title: "Profit margin",
    summary: "How much of the month's revenue is left after cost.",
    formula: "(Revenue − Cost) ÷ Revenue × 100",
    details: [
      "Revenue follows invoice dates and cost follows work dates, so a month with work not yet invoiced can show a low or negative margin.",
    ],
    wiki: KPI_WIKI,
  },
} satisfies Record<string, FieldHelp>;

const LEADERSHIP_WIKI = "Leadership-Dashboard";

export const LEADERSHIP_WIDGET_HELP = {
  heatmap: {
    title: "Heatmap",
    summary:
      "How much of each role's working time is allocated, week by week, for 16 weeks from this week.",
    formula: "Confirmed allocated hours ÷ working hours, per role and week.",
    details: [
      "Red means free time, not over-allocation.",
      "Working hours skip weekends and holidays. Tentative allocations don't count.",
      "Can be up to a day old.",
    ],
    wiki: `${LEADERSHIP_WIKI}#heatmap`,
  },
  utilisation: {
    title: "Utilised time",
    summary:
      "How the hours logged in the last 30 days split between billable and non-billable work, for the selected roles.",
    formula: "Billable % = billable hours ÷ all hours logged × 100",
    details: [
      "Each person counts under their current designation. Rejected timesheets are left out.",
      "Can be up to 6 hours old.",
    ],
    wiki: `${LEADERSHIP_WIKI}#utilised-time-in-the-past-30-days`,
  },
  forecast: {
    title: "Forecast breakdown",
    summary:
      "How working time in the next 30 days is allocated, for the selected roles.",
    formula:
      "Per working day, confirmed and tentative allocations fill each person's daily hours. The rest is unallocated.",
    details: [
      "Weekends and holidays are skipped.",
      "Can be up to 6 hours old.",
    ],
    wiki: `${LEADERSHIP_WIKI}#forecast-breakdown-for-the-next-month`,
  },
  calendar: {
    title: "Calendar",
    summary:
      "Milestones and touchpoints from the Calendar tab of the projects you can access, for 14 days from a Monday.",
    legend: [
      {
        label: "Phase or delivery",
        sample: "Milestone",
        className: "rounded-md bg-violet-100 px-1.5 py-0.5 text-violet-700",
      },
      {
        label: "One-day check-in",
        sample: "Touchpoint",
        className: "rounded-md bg-blue-100 px-1.5 py-0.5 text-blue-700",
      },
    ],
    details: [
      "Each entry shows on its start date.",
      "The project filter lists only projects with entries in this range. Your choice is remembered in this browser and shared by both dashboards.",
      "Can be up to 6 hours old.",
    ],
    wiki: `${LEADERSHIP_WIKI}#calendar-timeline`,
  },
} satisfies Record<string, FieldHelp>;

const STAT_WIKI = `${LEADERSHIP_WIKI}#leadership-stat-cards`;

export const LEADERSHIP_STAT_HELP = {
  atRiskProjects: {
    title: "At risk projects",
    summary: "Active projects whose RAG status is Red or Amber.",
    wiki: STAT_WIKI,
  },
  membersWithoutAllocation: {
    title: "Members without allocation",
    summary:
      "Active people allocated below their daily hours on at least one working day in the last 30 days.",
    details: [
      "Partly allocated people count, not only people with nothing allocated.",
      "Can be up to 6 hours old.",
    ],
    wiki: STAT_WIKI,
  },
  nonBillableHours: {
    title: "Non-billable hours logged",
    summary: "Hours logged on non-billable entries in the last 30 days.",
    details: ["Can be up to 6 hours old."],
    wiki: STAT_WIKI,
  },
} satisfies Record<string, FieldHelp>;

const MANAGER_WIKI = "Manager-Dashboard";
const MANAGER_STAT_WIKI = `${MANAGER_WIKI}#greeting-and-stat-cards`;
const MANAGER_TIMESHEETS_WIKI = `${MANAGER_WIKI}#timesheets-and-upcoming-time-offs`;

export const MANAGER_STAT_HELP = {
  atRiskProjects: {
    ...LEADERSHIP_STAT_HELP.atRiskProjects,
    wiki: MANAGER_STAT_WIKI,
  },
  membersWithoutAllocation: {
    ...LEADERSHIP_STAT_HELP.membersWithoutAllocation,
    summary:
      "Active people organisation-wide allocated below their daily hours on any working day in the last 7 days.",
    wiki: MANAGER_STAT_WIKI,
  },
  timesheetsToReview: {
    title: "Timesheets to review",
    summary:
      "Your direct reports' timesheets from the last 7 days that are waiting for approval.",
    details: [
      "Each day is a separate timesheet, so one person can add several to the count.",
    ],
    wiki: MANAGER_STAT_WIKI,
  },
  outstandingTimesheets: {
    title: "Outstanding timesheets",
    summary:
      "Direct reports with fewer days of timesheets than working days to cover, in the 7 days up to yesterday.",
    details: [
      "Weekends, holidays and full-day leave are skipped. A half day of leave still needs a timesheet.",
      "Can be up to 6 hours old.",
    ],
    wiki: MANAGER_STAT_WIKI,
  },
} satisfies Record<string, FieldHelp>;

export const MANAGER_WIDGET_HELP = {
  heatmap: {
    ...LEADERSHIP_WIDGET_HELP.heatmap,
    summary:
      "How much of each role's working time is allocated across the whole organisation, week by week, for 16 weeks from this week.",
    wiki: `${MANAGER_WIKI}#heatmap`,
  },
  calendar: {
    ...LEADERSHIP_WIDGET_HELP.calendar,
    wiki: `${MANAGER_WIKI}#calendar`,
  },
  timesheets: {
    title: "Timesheets",
    summary: "Hours each direct report logged in the selected period.",
    details: [
      "Last week covers the last 7 days, including today. This week runs from Monday to today.",
      "Draft and submitted timesheets both count.",
      "Can be up to a day old.",
    ],
    wiki: MANAGER_TIMESHEETS_WIKI,
  },
} satisfies Record<string, FieldHelp>;

export const LEAVE_APPROVAL_TOOLTIP =
  "You're in Notify users on this leave. Only their reporting manager can approve or reject it.";

const MANAGED_PROJECTS_WIKI = `${MANAGER_WIKI}#review-managed-projects-and-team-hours`;

export const MANAGED_PROJECTS_HELP = {
  remaining: {
    title: "Remaining",
    summary: "Purchased hours not yet used by billable time.",
    formula: "Hours purchased − billable hours logged",
    details: [
      "Only Retainer and Fixed Cost projects track purchased hours. Others show 0h.",
      "Goes below zero when the project runs over.",
      "Can be up to 6 hours old.",
    ],
    wiki: MANAGED_PROJECTS_WIKI,
  },
  hoursBurn: {
    title: "Hours Burn",
    summary: "How much of the purchased hours is used so far.",
    formula: "Hours logged ÷ hours purchased",
    details: [
      "Billable and non-billable hours both count.",
      "The bar stops at 100% when the project is over budget.",
      "Projects without purchased hours show an empty bar.",
    ],
    wiki: MANAGED_PROJECTS_WIKI,
  },
} satisfies Record<string, FieldHelp>;

export const MANAGED_PROJECTS_HOURS_TOOLTIP =
  "Hours logged on the project in the last 7 days.";

export const TEAM_TIMESHEETS_HELP = {
  expected: {
    title: "Expected h",
    summary: "Hours the member should have logged in the period.",
    formula: "Daily working hours × working days in the period",
    details: ["Weekends and holidays are skipped."],
    wiki: MANAGER_TIMESHEETS_WIKI,
  },
  delta: {
    title: "Delta",
    summary: "Expected hours the member hasn't logged yet.",
    formula: "Expected h − Billable h − Non-billable h",
    details: ["A negative number means more hours were logged than expected."],
    wiki: MANAGER_TIMESHEETS_WIKI,
  },
  status: {
    title: "Status",
    summary: "The approval status of the member's timesheets in the period.",
    legend: [
      {
        label: "Approved",
        icon: STATUS_ICONS.approved.Icon,
        className: STATUS_ICONS.approved.className,
      },
      {
        label: "Not yet approved",
        icon: STATUS_ICONS.pending.Icon,
        className: STATUS_ICONS.pending.className,
      },
      {
        label: "Rejected or partly rejected",
        icon: STATUS_ICONS.rejected.Icon,
        className: STATUS_ICONS.rejected.className,
      },
      {
        label: "Processing",
        icon: STATUS_ICONS.processing.Icon,
        className: STATUS_ICONS.processing.className,
      },
    ],
    wiki: MANAGER_TIMESHEETS_WIKI,
  },
} satisfies Record<string, FieldHelp>;
