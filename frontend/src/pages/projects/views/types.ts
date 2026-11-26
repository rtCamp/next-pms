/** A PMS View Setting row for Project, or one of the page's built-in views. */
export interface ProjectView {
  name: string;
  label: string;
  /** A `lucide-*` class on built-in views, an emoji on saved ones. */
  icon?: string | null;
  /** The user who saved it; absent on built-in views. */
  owner?: string;
  user?: string | null;
  default: 0 | 1;
  public: 0 | 1;
  dt: string;
  /** `List` is the list; `Custom` is the kanban. */
  type: "List" | "Custom";
  columns: string[];
  rows: unknown[];
  /** Query params the view applies, keyed by `FILTER_PARAM_KEYS`. */
  filters: Record<string, unknown>;
  order_by: unknown[];
  pinnedColumns: string[];
}
