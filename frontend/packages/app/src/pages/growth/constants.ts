import type { GrowthListColumn } from "@/pages/project-details/tabs/growth/types";
import type { PipelineFilters, PipelineSort } from "./types";

export const PIPELINE_METHOD =
  "next_pms.next_projects.api.growth.get_growth_pipeline";
export const MOVE_STAGE_METHOD =
  "next_pms.next_projects.api.growth.move_growth_stage";

export const DEFAULT_PIPELINE_CURRENCY = "USD";

export const DEFAULT_PIPELINE_FILTERS: PipelineFilters = {
  search: "",
  customer: "",
  activityOwner: "",
  projectManager: "",
  category: "",
  clientPriority: "",
  status: "",
};

export const PIPELINE_SORT_OPTIONS: { label: string; value: PipelineSort }[] = [
  { label: "Last updated", value: "modified" },
  { label: "Billable outcome", value: "converted_outcome" },
  { label: "Title", value: "activity" },
];

export const VIEW_PARAM = "view";
export const CLOSED_COLUMN_PREFIX = "closed:";
export const PIPELINE_COLUMN_WIDTH = 264;
export const CLICK_DRAG_THRESHOLD_PX = 5;
export const NO_CLIENT_LABEL = "No client";

export const OPEN_LIST_COLUMNS: GrowthListColumn[] = [
  { key: "activity", label: "Growth initiative", width: "220px", flex: 3 },
  { key: "project", label: "Project", width: "160px", flex: 2 },
  { key: "status", label: "Stage", width: "120px", flex: 1 },
  { key: "client_priority", label: "Priority", width: "110px", flex: 0 },
  {
    key: "billable_outcome",
    label: "Billable outcome",
    width: "130px",
    flex: 0,
  },
  { key: "activity_owner", label: "Owner", width: "150px", flex: 0 },
  { key: "project_manager", label: "PM", width: "150px", flex: 0 },
  { key: "modified", label: "Updated", width: "100px", flex: 0 },
];

export const CLOSED_LIST_COLUMNS = OPEN_LIST_COLUMNS.map((column) =>
  column.key === "status"
    ? { key: "closed_status", label: "Outcome", width: "120px", flex: 1 }
    : column,
);
