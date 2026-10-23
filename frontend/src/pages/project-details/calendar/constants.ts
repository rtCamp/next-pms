import type {
  CalendarView,
  TableTab,
  TimelineItemType,
  TypeFilter,
} from "./types";

export const TIMELINE_API =
  "/api/v2/method/next_pms.next_projects.api.project_timeline_item";

export const TIMELINE_ITEM_DOCTYPE = "Project Timeline Item";

/** The Calendar tab's view: absent for the calendar grid. */
export const VIEW_PARAM = "view";

/** The table's tab, milestones or touchpoints: absent for milestones. */
export const TYPE_PARAM = "type";

/** The List view's title search: absent when empty. */
export const SEARCH_PARAM = "search";

export const CALENDAR_VIEWS: { label: string; value: CalendarView }[] = [
  { label: "Calendar", value: "calendar" },
  { label: "Gantt", value: "gantt" },
  { label: "List", value: "list" },
];
export const DEFAULT_VIEW: CalendarView = "calendar";

export const TABLE_TABS: { label: string; value: TableTab }[] = [
  { label: "Milestones", value: "milestones" },
  { label: "Touchpoints", value: "touchpoints" },
];
export const DEFAULT_TABLE_TAB: TableTab = "milestones";

export const TABLE_TAB_TYPE: Record<TableTab, TimelineItemType> = {
  milestones: "Milestone",
  touchpoints: "Touchpoint",
};

export const TYPE_FILTERS: { label: string; value: TypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "Milestones", value: "milestones" },
  { label: "Touchpoints", value: "touchpoints" },
];

/** React reads at most this many items for a month, with no "more". */
export const MONTH_ITEM_LIMIT = 200;

export const LIST_PAGE_SIZE = 20;

export const SEARCH_DEBOUNCE_MS = 400;

export const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Room a floating Gantt label needs on its right before it flips to the left, in px. */
export const FLOATING_LABEL_FLIP_PX = 150;

export const HOVER_OPEN_DELAY = 200;
export const HOVER_CLOSE_DELAY = 150;

/** Pill, bar and chip colours of each type. */
export const TYPE_COLOR: Record<TimelineItemType, string> = {
  Milestone: "bg-surface-blue-2 text-ink-blue-7",
  Touchpoint: "bg-surface-violet-2 text-ink-violet-7 dark:bg-surface-violet-1",
};

export const TYPE_TEXT_COLOR: Record<TimelineItemType, string> = {
  Milestone: "text-ink-blue-7",
  Touchpoint: "text-ink-violet-7",
};

/** The category a new item gets, as React. */
export const DEFAULT_CATEGORY: Record<TimelineItemType, string> = {
  Milestone: "Other - Milestone",
  Touchpoint: "Other - Touchpoint",
};

export const CATEGORY_LIMIT = 100;

export interface TableColumn {
  key:
    | "title"
    | "category"
    | "startDate"
    | "plannedEndDate"
    | "actualEndDate"
    | "todos"
    | "owner"
    | "watchers"
    | "actions";
  label: string;
}

export const MILESTONE_COLUMNS: TableColumn[] = [
  { key: "title", label: "Title" },
  { key: "category", label: "Type" },
  { key: "startDate", label: "Start date" },
  { key: "plannedEndDate", label: "Planned end" },
  { key: "actualEndDate", label: "Actual end" },
  { key: "todos", label: "ToDos" },
  { key: "owner", label: "Owners" },
  { key: "watchers", label: "Watchers" },
  { key: "actions", label: "" },
];

export const TOUCHPOINT_COLUMNS: TableColumn[] = MILESTONE_COLUMNS.filter(
  (column) => column.key !== "startDate",
).map((column) =>
  column.key === "plannedEndDate"
    ? { ...column, label: "Planned date" }
    : column.key === "actualEndDate"
      ? { ...column, label: "Actual date" }
      : column,
);

/** Watchers shown before the "+N". */
export const WATCHER_STACK_SIZE = 4;
