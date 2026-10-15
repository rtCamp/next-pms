import type { SortState } from "@/components/SortSelector";
import type { ProjectListColumn, ProjectStatus, RagStatus } from "./types";

export const PROJECTS_VIEW_METHOD =
  "next_pms.next_projects.api.project.get_projects_view";

export const PROJECT_LIST_PAGE_SIZE = 20;

/** The kanban loads every matching project in one request. */
export const KANBAN_PROJECT_LIMIT = 10000;

export const DEFAULT_PROJECT_SORT: SortState = {
  field: "modified",
  order: "desc",
};

/** Sorts that need a currency, since the server converts the amounts into it. */
export const MONETARY_SORT_FIELDS = ["burn_rate_per_week", "total_budget"];

export const CURRENCY_REQUIRED_TOOLTIP =
  "Select a currency to enable this sort";

export const RAG_STATUSES: RagStatus[] = ["red", "amber", "green"];

export const RAG_OPTIONS = [
  { label: "Red", value: "red" },
  { label: "Amber", value: "amber" },
  { label: "Green", value: "green" },
];

export const PROJECT_STATUS_OPTIONS: {
  label: string;
  value: ProjectStatus | "";
}[] = [
  { label: "Open", value: "Open" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "All", value: "" },
];

export const BILLING_TYPE_OPTIONS = [
  "Non-Billable",
  "Fixed Cost",
  "Retainer",
  "Time and Material",
].map((type) => ({ label: type, value: type }));

/** The query params a saved view stores, besides its column layout. */
export const FILTER_PARAM_KEYS = [
  "search",
  "rag",
  "phase",
  "status",
  "advanced",
  "currency",
  "sortField",
  "sortOrder",
] as const;

/** Query params holding the list's column layout, as the view saves it. */
export const COLUMN_ORDER_PARAM = "columnOrder";
export const PINNED_COLUMNS_PARAM = "pinned";

export const MAX_PINNED_COLUMNS = 3;

export const PIN_LIMIT_TOOLTIP = `You can pin up to ${MAX_PINNED_COLUMNS} columns`;

export const PROJECT_LIST_COLUMNS: ProjectListColumn[] = [
  {
    key: "name",
    label: "Project name",
    width: "240px",
    sortField: "project_name",
  },
  {
    key: "phase",
    label: "Phase",
    width: "160px",
    sortField: "custom_project_phase",
  },
  {
    key: "burn_rate_per_week",
    label: "Burn rate/week",
    width: "130px",
    sortField: "burn_rate_per_week",
  },
  {
    key: "cost_burn_percent",
    label: "Cost burn",
    width: "140px",
    sortField: "cost_burn_percent",
  },
  {
    key: "total_budget",
    label: "Total budget",
    width: "130px",
    sortField: "total_budget",
  },
  {
    key: "profit_margin",
    label: "Profit margin",
    width: "120px",
    sortField: "profit_margin",
  },
  {
    key: "start_date",
    label: "Start date",
    width: "130px",
    sortField: "expected_start_date",
  },
  {
    key: "next_milestone",
    label: "Next milestone",
    width: "140px",
    sortField: "custom_next_milestone",
  },
  {
    key: "end_date",
    label: "End date",
    width: "120px",
    sortField: "expected_end_date",
  },
  {
    key: "project_manager",
    label: "Project manager",
    width: "200px",
    sortField: "custom_project_manager_name",
  },
  {
    key: "engineering_manager",
    label: "Lead engineer",
    width: "200px",
    sortField: "custom_engineering_manager_name",
  },
  {
    key: "project_type",
    label: "Project type",
    width: "120px",
    sortField: "project_type",
    defaultHidden: true,
  },
  {
    key: "customer",
    label: "Client name",
    width: "180px",
    sortField: "customer",
  },
  {
    key: "contract_end_date",
    label: "Contract end date",
    width: "160px",
    sortField: "contract_end_date",
  },
  {
    key: "lifetime_value_to_date",
    label: "Lifetime value to date",
    width: "170px",
    defaultHidden: true,
  },
  {
    key: "client_poc_name",
    label: "Client POC",
    width: "180px",
    defaultHidden: true,
  },
];

export const PROJECT_SORT_FIELDS = [
  { field: "project_name", label: "Project name" },
  { field: "custom_project_phase", label: "Phase" },
  { field: "burn_rate_per_week", label: "Burn rate/week" },
  { field: "cost_burn_percent", label: "Cost burn" },
  { field: "total_budget", label: "Total budget" },
  { field: "profit_margin", label: "Profit margin" },
  { field: "expected_start_date", label: "Start date" },
  { field: "custom_next_milestone", label: "Next milestone" },
  { field: "expected_end_date", label: "End date" },
  { field: "custom_project_manager_name", label: "Project manager" },
  { field: "custom_engineering_manager_name", label: "Lead engineer" },
  { field: "project_type", label: "Project type" },
  { field: "customer", label: "Client name" },
  { field: "contract_end_date", label: "Contract end date" },
  { field: "modified", label: "Last Updated On" },
];

export const KANBAN_COLUMN_WIDTH = 284;

/** A press that moves further than this is a drag, not a click on the card. */
export const CLICK_DRAG_THRESHOLD_PX = 5;
