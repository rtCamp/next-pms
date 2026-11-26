/** One schedule of `get_project_feedback_timeline`; `month` is 1–12. */
export interface TimelineEntry {
  period_from: string;
  period_to: string;
  month: number;
  year: number;
  label: string;
  /** 0–100, or `null` while the schedule is unanswered. */
  score: number | null;
  feedback_id: string | null;
}

/** A month the timeline shows; `month` is 0–11. */
export interface TimelineMonth {
  key: string;
  year: number;
  month: number;
  score: number | null;
  feedbackId: string | null;
}

export interface MonthKey {
  year: number;
  /** 0–11 */
  month: number;
}

/** The months the timeline covers, as `YYYY-MM`. */
export interface TimelineWindow {
  start: string;
  end: string;
}

export interface FeedbackRating {
  fieldname: string;
  label: string;
  /** 0–1 */
  value: number | null;
  percent: number | null;
  stars: number | null;
  star_max: number;
}

export interface ClientBreakdown {
  feedback_id: string;
  period_from: string;
  period_to: string;
  overall_score: number | null;
  ratings: FeedbackRating[];
  responses: { fieldname: string; label: string; answer: string | null }[];
}

export interface TeamFeedbackRow {
  name: string;
  period_from: string;
  period_to: string;
  employee: string;
  employee_name: string;
  avatar_url: string | null;
  customer: string;
  feedback_by: string;
  customer_avatar_url: string | null;
  contact_email: string | null;
  evaluation_type: string;
  /** On the star scale, e.g. 2.8 of 4. */
  average: number | null;
  stars: number | null;
  star_max: number;
}

export interface TeamFeedbackPage {
  data: TeamFeedbackRow[];
  total: number;
  has_more: boolean;
}

export interface TeamBreakdown {
  feedback_id: string;
  evaluation_type: string;
  employee: string;
  employee_name: string;
  avatar_url: string | null;
  customer: string;
  feedback_by: string;
  customer_avatar_url: string | null;
  period_from: string;
  period_to: string;
  average: number | null;
  ratings: (FeedbackRating & { fieldtype: string })[];
  areas_for_improvement: string | null;
}
