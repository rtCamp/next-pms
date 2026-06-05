export type FeedbackType = "client" | "team";

export interface MonthEntry {
  key: string;
  month: string;
  year: number;
  score: number | null;
}

export interface BreakdownMetric {
  label: string;
  rating: number;
  percentage: number;
}

export interface ResponseItem {
  question: string;
  answer: string;
}

export interface TeamFeedbackPerson {
  name: string;
  image?: string;
}

export interface TeamFeedbackRow {
  id: string;
  from: string;
  to: string;
  member: TeamFeedbackPerson;
  customer: TeamFeedbackPerson;
  avgRating: number;
}
