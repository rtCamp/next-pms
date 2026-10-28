/**
 * External dependencies.
 */
import {
  BudgetBurnBar,
  type FieldHelp,
  type HelpTip,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { Dot } from "./list/cells/dot";
import type { RagStatus } from "./types";

const FORECAST_COST =
  "Forecast cost is the cost of allocated work from today onwards.";

export const PROJECT_LIST_HELP = {
  name: {
    title: "Project health",
    summary:
      "The coloured dot before a project's name shows how the project is doing.",
    legend: [
      { label: "Needs attention", children: <Dot risk="red" /> },
      { label: "Keep an eye on it", children: <Dot risk="amber" /> },
      { label: "On track", children: <Dot risk="green" /> },
    ],
    details: [
      "It is worked out automatically from cost and hours burn, open risks, overdue milestones, overdue invoices and customer feedback. The worst one decides the colour.",
      "Open projects are refreshed every week, and sooner when a risk, milestone, invoice or customer feedback changes.",
    ],
    wiki: "RAG-Statistics#introduction",
  },
  burn_rate_per_week: {
    title: "Burn rate/week",
    summary:
      "How much billable work is logged per week, valued at billing rates.",
    formula: "Value of billable time logged ÷ weeks since the Start date",
    details: [
      "A project less than a week old counts as one week.",
      "Shows N/A when no billable time is logged or the project has no start date.",
    ],
    wiki: "Projects#list-view",
  },
  cost_burn_percent: {
    title: "Cost burn",
    summary:
      "How much of the total budget is used up so far, with the forecast for upcoming work added on.",
    formula: "Used so far ÷ total budget",
    legend: [
      {
        label: "Used so far",
        children: <BudgetBurnBar value={40} size="sm" className="w-20" />,
      },
      {
        label: "Forecast to come",
        children: (
          <BudgetBurnBar
            value={0}
            secondaryValue={40}
            size="sm"
            className="w-20"
          />
        ),
      },
      {
        label: "Target cost",
        children: (
          <BudgetBurnBar
            value={0}
            markerValue={80}
            size="sm"
            className="w-20"
          />
        ),
      },
      {
        label: "Under 60% of target cost",
        children: (
          <BudgetBurnBar
            value={20}
            secondaryValue={15}
            markerValue={80}
            size="sm"
            className="w-20"
          />
        ),
      },
      {
        label: "60–80% of target cost",
        children: (
          <BudgetBurnBar
            value={30}
            secondaryValue={25}
            markerValue={80}
            size="sm"
            className="w-20"
          />
        ),
      },
      {
        label: "Over 80% of target cost",
        children: (
          <BudgetBurnBar
            value={40}
            secondaryValue={30}
            markerValue={80}
            size="sm"
            className="w-20"
          />
        ),
      },
    ],
    details: [
      "Used so far is the billing value of time logged on a billable project, or the cost of time logged on a Non-Billable one.",
      FORECAST_COST,
      "The colour compares used plus forecast with the target cost, or with the total budget when no target cost is set.",
    ],
    wiki: "Projects#list-view",
  },
  total_budget: {
    title: "Total budget",
    summary:
      "The project's budget. Billable projects use the total of their submitted Sales Orders. Non-Billable projects use their Estimated Cost.",
    wiki: "Projects#list-view",
  },
  profit_margin: {
    title: "Profit margin",
    summary:
      "The share of the total budget left over after the cost so far and the forecast cost of upcoming work.",
    formula:
      "(Total budget − cost so far − forecast cost) ÷ total budget × 100",
    details: [
      "Cost so far is the cost of time logged on the project.",
      FORECAST_COST,
    ],
    wiki: "Projects#list-view",
  },
  lifetime_value_to_date: {
    title: "Lifetime value to date",
    summary:
      "The lifetime value entered on the project's form in Desk. It isn't calculated from invoices or time logged.",
    details: ["Shows N/A when nobody has entered a value."],
    wiki: "Projects#list-view",
  },
} satisfies Record<string, FieldHelp>;

export const CURRENCY_HELP: FieldHelp = {
  title: "Currency",
  summary:
    "Shows the Burn rate/week, Total budget and Lifetime value to date columns in this currency, converted at today's exchange rate.",
  details: [
    "Clear it to show each project's amounts in its own currency.",
    "Kanban shows no amounts, so this has no effect there.",
  ],
  wiki: "Projects#view-switcher-and-toolbar",
};

export const CURRENCY_SORT_TOOLTIP =
  "Select a Currency first. Amounts in different currencies can't be compared.";

export const PROJECT_HEALTH_TOOLTIP: Record<RagStatus, string> = {
  red: "Project health: needs attention",
  amber: "Project health: keep an eye on it",
  green: "Project health: on track",
};

export const KANBAN_CARD_TOOLTIP = {
  dates: "Start and end date",
  projectManager: "Project manager",
  leadEngineer: "Lead engineer",
  billingType: "Billing type",
};

export const PROJECTS_TIPS: HelpTip[] = [
  {
    id: "switch-view",
    title: "Switch views from the page title",
    body: "Select the view name next to Projects, such as List view, to switch to Kanban view or one of your saved views. The filters you set carry over between List view and Kanban view.",
    wiki: "Projects#switch-between-list-and-kanban",
  },
  {
    id: "save-view",
    title: "Save your filters and columns as a view",
    body: "Set the filters, sort and columns you want, then select Create view in the toolbar. On a saved view, select Save changes and then Update to keep new changes.",
    wiki: "Saved-Views#create-a-saved-view",
  },
  {
    id: "manage-view",
    title: "Edit or share a saved view from its ⋯ menu",
    body: "Open the view menu next to Projects and select ⋯ on a saved view to duplicate, edit, make public or delete it. Views someone else created can only be duplicated.",
    wiki: "Saved-Views#manage-a-saved-view",
  },
  {
    id: "columns",
    title: "Sort, move and pin columns",
    body: "In List view, select a column name to sort by it, and again to reverse the order. Drag a header sideways to move it, or open the arrow beside its name and select Pin column to keep up to 3 columns in view as you scroll.",
    wiki: "Projects#customise-columns",
  },
  {
    id: "change-phase",
    title: "Drag a card to change its phase",
    body: "In Kanban view, drag a project's card to another phase column. The new phase is saved at once.",
    wiki: "Projects#kanban-view",
  },
];
