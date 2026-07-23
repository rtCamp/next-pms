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
  name: string;
  user: string;
  user_full_name: string;
  user_image: string | null;
  comment: string;
  reply_to: string | null;
  created_at: string;
  modified_at: string | null;
  edited: boolean;
  deleted: boolean;
  deleted_at: string | null;
  reply_count: number;
  replies: FeedbackComment[];
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
