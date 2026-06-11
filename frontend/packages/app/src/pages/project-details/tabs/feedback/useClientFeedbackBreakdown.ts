/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { BreakdownMetric, ResponseItem } from "./types";

interface BreakdownAPIRating {
  fieldname: string;
  label: string;
  value: number | null;
  percent: number | null;
  stars: number | null;
  star_max: number;
}

interface BreakdownAPIResponse {
  fieldname: string;
  label: string;
  answer: string | null;
}

interface BreakdownAPIResult {
  feedback_id: string;
  period_from: string;
  period_to: string;
  overall_score: number | null;
  ratings: BreakdownAPIRating[];
  responses: BreakdownAPIResponse[];
}

export function useClientFeedbackBreakdown(feedbackId: string | null) {
  const { data, isLoading, error } = useFrappeGetCall<{
    message: BreakdownAPIResult;
  }>(
    "next_pms.next_projects.api.feedback.get_project_feedback_breakdown",
    { feedback_name: feedbackId ?? "" },
    feedbackId ? undefined : null,
  );

  const breakdown = useMemo((): BreakdownMetric[] => {
    return (data?.message?.ratings ?? []).map((r) => ({
      label: r.label,
      rating: r.stars ?? 0,
      percentage: r.percent ?? 0,
    }));
  }, [data]);

  const responses = useMemo((): ResponseItem[] => {
    return (data?.message?.responses ?? [])
      .filter((r) => r.answer != null)
      .map((r) => ({ question: r.label, answer: r.answer! }));
  }, [data]);

  return { breakdown, responses, isLoading, error };
}
