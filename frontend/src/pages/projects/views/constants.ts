import type { ProjectView } from "./types";

const BUILT_IN_VIEW_BASE = {
  default: 0,
  public: 1,
  dt: "Project",
  columns: [],
  rows: [],
  filters: {},
  order_by: [],
  pinnedColumns: [],
} satisfies Partial<ProjectView>;

export const BUILT_IN_VIEWS: ProjectView[] = [
  {
    ...BUILT_IN_VIEW_BASE,
    name: "list",
    label: "List view",
    icon: "lucide-align-left",
    type: "List",
  },
  {
    ...BUILT_IN_VIEW_BASE,
    name: "kanban",
    label: "Kanban view",
    icon: "lucide-kanban",
    type: "Custom",
  },
];
