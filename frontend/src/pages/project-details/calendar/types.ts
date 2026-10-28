export type TimelineItemType = "Milestone" | "Touchpoint";
export type CalendarView = "calendar" | "gantt" | "list";
export type TableTab = "milestones" | "touchpoints";
export type TypeFilter = "all" | TableTab;

export interface UserRef {
  userId: string;
  fullName: string;
  image?: string;
}

export interface ApiUserRef {
  user: string;
  full_name: string;
  image: string | null;
}

/** An item as `get_project_timeline_items` returns it. */
export interface ApiTimelineItem {
  name: string;
  title: string;
  project: string;
  type: TimelineItemType;
  category: string | null;
  category_label: string | null;
  is_complete: 0 | 1;
  is_internal: 0 | 1;
  start_date: string | null;
  planned_end_date: string | null;
  actual_end_date: string | null;
  owner: ApiUserRef | null;
  watchers: ApiUserRef[];
}

export interface TimelinePage {
  data: ApiTimelineItem[];
  total_count: number;
  has_more: boolean;
}

/** A milestone or touchpoint (`Project Timeline Item`). */
export interface TimelineItem {
  name: string;
  title: string;
  project: string;
  type: TimelineItemType;
  category?: string;
  categoryLabel?: string;
  isComplete: boolean;
  isInternal: boolean;
  startDate?: string;
  plannedEndDate: string;
  actualEndDate?: string;
  owner: UserRef;
  watchers: UserRef[];
}

export interface TimelineCategory {
  name: string;
  category_name: string;
}

/** The create / edit dialog's values; a touchpoint uses `plannedEndDate` as its date. */
export interface TimelineItemForm {
  title: string;
  category: string;
  startDate: string;
  plannedEndDate: string;
  owner: string;
  isInternal: boolean;
}

export type TimelineItemErrors = Partial<
  Record<keyof TimelineItemForm, string>
>;

/** A Gantt bar's place in the row, in px. */
export interface GanttPosition {
  left: number;
  width: number;
}
