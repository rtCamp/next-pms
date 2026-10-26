import type { SortField, SortState } from "@/components/SortSelector";
import type { GroupColumn } from "@/pages/project-details/shared/types";

export { GROWTH_DETAIL_PARAM as GROWTH_PARAM } from "@/pages/project-details/to-do/constants";

export const GROWTH_DOCTYPE = "PMS Growth Initiative";
export const GROWTH_STATUS_DOCTYPE = "PMS Growth Initiative Status";
export const GROWTH_CATEGORY_DOCTYPE = "PMS Growth Initiative Category";

export const CLIENT_PRIORITIES = ["Low", "Medium", "High"] as const;

/** Each status's dot colour; hard-coded as React. */
export const STATUS_DOT_CLASS: Record<string, string> = {
  Ideation: "text-ink-gray-4",
  "In Progress": "text-ink-amber-6",
  "On Hold": "text-ink-blue-6",
  Closed: "text-ink-green-6",
};

export type GrowthColumnKey =
  | "activity"
  | "category"
  | "client_priority"
  | "status"
  | "activity_owner"
  | "modified"
  | "closed_status";

const ACTIVITY: GroupColumn<GrowthColumnKey> = {
  key: "activity",
  label: "Activity",
  width: "220px",
  flex: 3,
};
const CATEGORY: GroupColumn<GrowthColumnKey> = {
  key: "category",
  label: "Category",
  width: "128px",
  flex: 1,
};
const OWNER: GroupColumn<GrowthColumnKey> = {
  key: "activity_owner",
  label: "Owner",
  width: "140px",
  flex: 0,
};
const LAST_UPDATED: GroupColumn<GrowthColumnKey> = {
  key: "modified",
  label: "Last Updated Date",
  width: "150px",
  flex: 0,
};

export const OPEN_GROWTH_COLUMNS: GroupColumn<GrowthColumnKey>[] = [
  ACTIVITY,
  CATEGORY,
  {
    key: "client_priority",
    label: "Priority for Client",
    width: "128px",
    flex: 0,
  },
  { key: "status", label: "Status", width: "120px", flex: 1 },
  OWNER,
  LAST_UPDATED,
];

export const CLOSED_GROWTH_COLUMNS: GroupColumn<GrowthColumnKey>[] = [
  ACTIVITY,
  CATEGORY,
  OWNER,
  LAST_UPDATED,
  { key: "closed_status", label: "Closed Status", width: "120px", flex: 1 },
];

export const GROWTH_SORT_FIELDS: SortField[] = [
  { field: "modified", label: "Last updated on" },
  { field: "activity", label: "Activity" },
  { field: "status", label: "Status" },
  { field: "category", label: "Category" },
  { field: "client_priority", label: "Priority for Client" },
];

export const DEFAULT_GROWTH_SORT: SortState = {
  field: "modified",
  order: "desc",
};

export const GROWTH_LIST_FIELDS = [
  "name",
  "project",
  "activity",
  "category",
  "client_priority",
  "status",
  "is_closed",
  "closed_status",
  "activity_owner",
  "ideation_owner",
  "modified",
];

/** The fields an update holds besides its audit fields. */
export const GROWTH_UPDATE_FIELDS = [
  "status",
  "closed_status",
  "client_priority",
  "billable_outcome",
  "note",
] as const;

export const GROWTH_LIST_LIMIT = 500;

export const EDIT_LOG_NOTE =
  "To change status, priority or billable outcome, add a new update instead.";
