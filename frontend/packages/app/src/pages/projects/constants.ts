/**
 * External dependencies.
 */
import { AlignLeft, Kanban } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { kebabToTitleCase } from "@/lib/utils";
import type { View } from "@/types";

export const PROJECTS_VIEW_METHOD =
  "next_pms.next_projects.api.project.get_projects_view";

const DEFAULT_PROJECT_VIEW_BASE = {
  default: 0,
  public: 1,
  dt: "Project",
  columns: [],
  rows: [],
  filters: {},
  order_by: [],
  pinnedColumns: [],
} satisfies Partial<View>;

export const DEFAULT_PROJECT_VIEWS: View[] = [
  {
    ...DEFAULT_PROJECT_VIEW_BASE,
    name: "list",
    label: "List view",
    icon: AlignLeft,
    type: "List",
  },
  {
    ...DEFAULT_PROJECT_VIEW_BASE,
    name: "kanban",
    label: "Kanban view",
    icon: Kanban,
    type: "Custom",
  },
];

export const PHASES = [
  "delivery-prep",
  "kick-off",
  "discovery",
  "development",
  "launch",
  "close-out",
] as const;

export const RAG_STATUS = ["red", "amber", "green"] as const;

export const PROJECT_LIST_PAGE_SIZE = 20;

export const RAG_OPTIONS = [
  { label: "Red", value: "red" },
  { label: "Amber", value: "amber" },
  { label: "Green", value: "green" },
];

export const STATUS_OPTIONS = [
  { label: "Open", value: "Open" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "All", value: "" },
];

export const PHASE_OPTIONS = [
  ...PHASES.map((phase) => ({
    label: kebabToTitleCase(phase),
    value: kebabToTitleCase(phase),
  })),
  { label: "All", value: "" },
];
