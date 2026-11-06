import type { SortField, SortState } from "@/components/SortSelector";
import type { GroupColumn } from "@/pages/project-details/shared/types";

export const RISK_DOCTYPE = "Risk";
export const RISK_CATEGORY_DOCTYPE = "Risk Category";

/** The open risk on the Risks tab: absent for the list. */
export const RISK_PARAM = "risk";

/** As React: the Risk Status and Risk Level masters aren't read. */
export const RISK_STATUSES = [
  "To-do",
  "In Progress",
  "Escalated",
  "Blocked",
  "Mitigated",
] as const;
export const RISK_LEVELS = ["Low", "Medium", "High"] as const;

/** The status that moves a risk to the "Mitigated Risk" group. */
export const MITIGATED_STATUS = "Mitigated";

/** Each status's dot colour. */
export const STATUS_DOT_CLASS: Record<string, string> = {
  "To-do": "bg-surface-gray-6",
  "In Progress": "bg-surface-amber-6",
  Escalated: "bg-surface-blue-6",
  Blocked: "bg-surface-red-6",
  Mitigated: "bg-surface-green-6",
};

export type RiskColumnKey =
  "risk_category" | "summary" | "risk_owner" | "risk_level" | "status";

export const RISK_COLUMNS: GroupColumn<RiskColumnKey>[] = [
  { key: "risk_category", label: "Risk category", width: "128px", flex: 1 },
  { key: "summary", label: "Risk Summary", width: "264px", flex: 4 },
  { key: "risk_owner", label: "Risk owner", width: "140px", flex: 0 },
  // 6px wider than React: InterVar sets the label 2px wider than Inter.
  { key: "risk_level", label: "Risk level", width: "80px", flex: 0 },
  { key: "status", label: "Status", width: "120px", flex: 1 },
];

export const RISK_SORT_FIELDS: SortField[] = [
  { field: "modified", label: "Last updated on" },
  { field: "status", label: "Status" },
  { field: "risk_category", label: "Risk category" },
  { field: "risk_level", label: "Risk level" },
];

export const DEFAULT_RISK_SORT: SortState = {
  field: "modified",
  order: "desc",
};

export const RISK_LIST_FIELDS = [
  "name",
  "project",
  "risk_category",
  "risk_level",
  "status",
  "summary",
  "owner",
  "risk_owner",
];

/** The fields an update holds besides its audit fields. */
export const RISK_UPDATE_FIELDS = ["status", "risk_level", "note"] as const;

export const RISK_LIST_LIMIT = 500;
export const RISK_CATEGORY_LIMIT = 100;

export const EMPLOYEE_LIST_METHOD =
  "next_pms.timesheet.api.employee.get_employee_list";

export const EDIT_LOG_NOTE =
  "To change status or risk level, add a new risk update instead.";
