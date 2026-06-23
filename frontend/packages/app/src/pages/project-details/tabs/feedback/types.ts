export type FeedbackType = "client" | "team";

export interface MonthYear {
  month: number;
  year: number;
}

export interface MonthEntry extends MonthYear {
  score: number | null;
  feedback_id: string | null;
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

export interface FeedbackRatingCategory {
  label: string;
  rating: number;
}

export interface FeedbackComment {
  author: TeamFeedbackPerson;
  timestamp: string;
  text: string;
}

export interface TeamFeedbackDetail {
  ratingCategories: FeedbackRatingCategory[];
  areasOfImprovement: string;
  comments: FeedbackComment[];
}

export interface TeamFeedbackBreakdownResult {
  feedbackId: string;
  evaluationType: string;
  employee: TeamFeedbackPerson;
  customer: TeamFeedbackPerson;
  feedbackBy: string;
  periodFrom: string;
  periodTo: string;
  average: number | null;
  areasOfImprovement: string | null;
}
