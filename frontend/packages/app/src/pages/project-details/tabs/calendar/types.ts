export type TimelineItemType = "Milestone" | "Touchpoint";

export type CalendarView = "calendar" | "gantt";

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
