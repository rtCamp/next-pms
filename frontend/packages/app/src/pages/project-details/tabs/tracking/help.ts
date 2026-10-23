/**
 * External dependencies.
 */
import type { FieldHelp } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { PROJECT_LIST_HELP } from "@/pages/projects/help";

const ACTUAL_COST =
  "Actual cost incurred is everyone's time logged on the project at their hourly cost to the company. It includes time not approved yet.";

const FORECAST_COST =
  "Forecasted cost to completion is the cost of allocated work from today onwards.";

export const TRACKING_HELP = {
  totalProjectValue: {
    title: "Total project value",
    summary: "The total of the project's submitted Sales Orders, before taxes.",
    details: ["Draft and cancelled Sales Orders don't count."],
    wiki: "Project-Detail#top-metrics",
  },
  currentProjectValue: {
    title: "Total project value",
    summary:
      "The value of the billable time logged so far, at the hourly rates in Project rates.",
    details: [
      "It includes time not approved yet.",
      "Select Projected in the ⋯ menu to see the total of submitted Sales Orders instead.",
    ],
    wiki: "Project-Detail#top-metrics",
  },
  projectedProfit: {
    title: "Projected profit",
    summary:
      "What the project is expected to make once all its allocated work is done.",
    formula:
      "Total project value − Actual cost incurred − Forecasted cost to completion",
    details: [
      ACTUAL_COST,
      FORECAST_COST,
      "Select Current in the ⋯ menu to leave out the forecast.",
    ],
    wiki: "Project-Detail#top-metrics",
  },
  projectedMargin: {
    title: "Projected profit margin",
    summary: "Projected profit as a share of the Total project value.",
    formula: "Projected profit ÷ Total project value × 100",
    details: ["Reads N/A when the Total project value is 0."],
    wiki: "Project-Detail#behaviour--states-2",
  },
  currentProfit: {
    title: "Current profit",
    summary:
      "What the project has made so far, from the time logged up to today.",
    formula: "Total project value − Actual cost incurred",
    details: [
      ACTUAL_COST,
      "On a Time and Material project, Total project value is the value of billable time logged so far. Other billing types use the full Sales Order total.",
      "Select Projected in the ⋯ menu to add the forecast cost of upcoming work.",
    ],
    wiki: "Project-Detail#top-metrics",
  },
  currentMargin: {
    title: "Current profit margin",
    summary: "Current profit as a share of the Total project value.",
    formula: "Current profit ÷ Total project value × 100",
    details: ["Reads N/A when the Total project value is 0."],
    wiki: "Project-Detail#behaviour--states-2",
  },
  taskCompletion: {
    title: "Task completion",
    summary: "The share of the project's tasks marked Completed.",
    formula: "Completed issues ÷ Total issues created × 100, rounded",
    details: [
      "Open issues counts every task that isn't Completed yet.",
      "Cancelled tasks are left out of all three numbers.",
    ],
    wiki: "Project-Detail#top-metrics",
  },
  hoursUsage: {
    title: "Hours usage",
    summary: "The hours logged on the project so far, against its hour target.",
    formula: "Total hours remaining = hour target − Total hours utilised",
    details: [
      "Total hours utilised counts everyone's time on the project, including time not approved yet.",
      "The hour target is the total Hours bought in Contracts on a Retainer project, and Target Hours on any other billing type.",
      "Total hours remaining goes below 0 once more hours are logged than the target.",
    ],
    wiki: "Project-Detail#top-metrics",
  },
  invoiceBurn: {
    title: "Invoice burn (to date)",
    summary:
      "How much of the Total project value has been invoiced so far, split into paid and still unpaid.",
    details: [
      "Counts the submitted Sales Invoices linked to this project. Drafts and cancelled invoices are left out.",
      "Invoiced but not paid is the amount still outstanding on those invoices.",
      "Total project value is the total of the project's submitted Sales Orders.",
    ],
    wiki: "Project-Detail#burn-cards",
  },
  budgetBurn: {
    title: "Budget burn (to date)",
    summary:
      "How much of the Total project budget is used up by billable work, valued at the hourly rates in Project rates.",
    details: [
      "Actual budget burn is the value of billable time logged so far, including time not approved yet.",
      "Forecasted budget burn is the value of billable allocated work from today onwards.",
      "Total project budget is the total of the project's submitted Sales Orders.",
    ],
    wiki: "Project-Detail#burn-cards",
  },
  costBurn: {
    title: "Cost burn (to date)",
    summary:
      "What the project's time has cost so far and will cost for upcoming allocated work, against its Target cost.",
    details: [
      ACTUAL_COST,
      FORECAST_COST,
      "Target cost is set on the project's form in Desk. The bar stops at full once costs pass it.",
    ],
    wiki: "Project-Detail#burn-cards",
  },
  lifetimeToDate: {
    ...PROJECT_LIST_HELP.lifetime_value_to_date,
    wiki: "Project-Detail#top-metrics",
  },
  lifetimeExpected: {
    title: "Expected lifetime value",
    summary:
      "The expected lifetime value entered on the project's form in Desk. It isn't calculated.",
    details: PROJECT_LIST_HELP.lifetime_value_to_date.details,
    wiki: "Project-Detail#top-metrics",
  },
  contractHours: {
    title: "Hours used",
    summary:
      "Billable hours logged on the project, including time not approved yet, used up contract by contract in the order listed.",
    details: [
      "Each contract fills up to its Hours bought before the next one starts, whatever its dates.",
      "Hours left is Hours bought − Hours used. On the last contract it goes below 0 once every contract is used up.",
      "Hours used and Hours left are worked out only on Fixed Cost and Retainer projects.",
    ],
    wiki: "Project-Detail#contracts",
  },
  flatRate: {
    title: "Flat rate",
    summary:
      "The project's default hourly billing rate, set as Default Hourly Billing Rate on the project's form in Desk.",
    details: [
      "On a Time and Material project, members listed here bill at their own rate from its Valid from date. Everyone else uses the flat rate.",
      "On other billing types everyone bills at the flat rate, even members listed here.",
      "With no flat rate set, time bills at three times the person's hourly cost.",
    ],
    wiki: "Project-Detail#project-rates",
  },
} satisfies Record<string, FieldHelp>;
