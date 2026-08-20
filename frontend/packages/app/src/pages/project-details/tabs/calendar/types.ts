export type TimelineItemType = "Milestone" | "Touchpoint";

export type CalendarView = "calendar" | "gantt" | "list";

export type TableTab = "milestones" | "touchpoints";

export type UserRef = {
  name: string;
  fullName: string;
  avatar?: string;
};

export type ProjectTimelineItem = {
  id: string;
  title: string;
  project: string;
  type: TimelineItemType;
  isComplete: boolean;
  startDate?: string;
  plannedEndDate: string;
  actualEndDate?: string;
  owner: UserRef;
  watchers: UserRef[];
};

export interface ApiUserRef {
  user: string;
  full_name: string;
  image: string | null;
}

export interface ApiTimelineItem {
  name: string;
  title: string;
  project: string;
  type: TimelineItemType;
  is_complete: 0 | 1;
  start_date: string | null;
  planned_end_date: string | null;
  actual_end_date: string | null;
  owner: ApiUserRef | null;
  watchers: ApiUserRef[];
}

export interface ApiTimelineItemsResponse {
  data: ApiTimelineItem[];
  total_count: number;
  has_more: boolean;
}
