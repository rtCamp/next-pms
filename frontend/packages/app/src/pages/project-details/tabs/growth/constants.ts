import type { GrowthListColumn } from "./types";

export const GROWTH_DOCTYPE = "PMS Growth Initiative";

const ACTIVITY_COLUMN: GrowthListColumn = {
  key: "activity",
  label: "Activity",
  width: "220px",
  flex: 3,
};
const CATEGORY_COLUMN: GrowthListColumn = {
  key: "category",
  label: "Category",
  width: "128px",
  flex: 1,
};
const OWNER_COLUMN: GrowthListColumn = {
  key: "activity_owner",
  label: "Owner",
  width: "140px",
  flex: 0,
};
const LAST_UPDATED_COLUMN: GrowthListColumn = {
  key: "modified",
  label: "Last Updated Date",
  width: "128px",
  flex: 0,
};

export const OPEN_GROWTH_COLUMNS: GrowthListColumn[] = [
  ACTIVITY_COLUMN,
  CATEGORY_COLUMN,
  {
    key: "client_priority",
    label: "Priority for Client",
    width: "128px",
    flex: 0,
  },
  { key: "status", label: "Status", width: "120px", flex: 1 },
  OWNER_COLUMN,
  LAST_UPDATED_COLUMN,
];

export const CLOSED_GROWTH_COLUMNS: GrowthListColumn[] = [
  ACTIVITY_COLUMN,
  CATEGORY_COLUMN,
  OWNER_COLUMN,
  LAST_UPDATED_COLUMN,
  { key: "closed_status", label: "Closed Status", width: "120px", flex: 1 },
];
