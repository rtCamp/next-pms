/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { BreakdownMetric, TeamFeedbackBreakdownResult } from "./types";

interface TeamBreakdownAPIRating {
  fieldname: string;
  label: string;
  fieldtype: string;
  value: number | null;
  percent: number | null;
  stars: number | null;
  star_max: number;
}
export interface TeamBreakdownAPIResult {
  feedback_id: string;
  evaluation_type: string;
  employee: string;
  employee_name: string;
  avatar_url: string;
  customer: string;
  customer_avatar_url: string;
  feedback_by: string;
  period_from: string;
  period_to: string;
  average: number | null;
  ratings: TeamBreakdownAPIRating[];
  areas_for_improvement: string | null;
}

export function useTeamFeedbackBreakdown(feedbackId: string | null) {
  const { data, isLoading, error } = useFrappeGetCall<{
    message: TeamBreakdownAPIResult;
  }>(
    "next_pms.next_projects.api.feedback.get_team_feedback_breakdown",
    { feedback_name: feedbackId ?? "" },
    feedbackId ? undefined : null,
  );

  const detail = useMemo((): TeamFeedbackBreakdownResult => {
    if (!data?.message) return {} as TeamFeedbackBreakdownResult;

    const d = data.message;
    return {
      feedbackId: d.feedback_id,
      evaluationType: d.evaluation_type,
      employee: {
        name: d.employee_name,
        image: d.avatar_url,
      },
      customer: {
        name: d.customer,
        image: d.customer_avatar_url,
      },
      feedbackBy: d.feedback_by,
      periodFrom: d.period_from,
      periodTo: d.period_to,
      average: d.average,
      areasOfImprovement: d.areas_for_improvement,
    };
  }, [data]);

  const breakdown = useMemo((): BreakdownMetric[] => {
    return (data?.message?.ratings ?? []).map((r) => ({
      label: r.label,
      rating: r.stars ?? 0,
      percentage: r.percent ?? 0,
    }));
  }, [data]);

  return {
    detail,
    breakdown,
    isLoading,
    error,
  };
}
