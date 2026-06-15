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

interface TeamBreakdownAPIRating {
  fieldname: string;
  label: string;
  fieldtype: string;
  value: number | null;
  percent: number | null;
  stars: number | null;
  star_max: number;
}

export interface TeamBreakdownResult {
  feedback_id: string;
  evaluation_type: string;
  employee: string;
  employee_name: string;
  customer: string;
  feedback_by: string;
  period_from: string;
  period_to: string;
  average: number | null;
  ratings: TeamBreakdownAPIRating[];
  areas_for_improvement: string | null;
}
