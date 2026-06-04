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
