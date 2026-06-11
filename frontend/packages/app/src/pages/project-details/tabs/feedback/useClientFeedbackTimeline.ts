/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "@/pages/project-details/context";
import type { MonthEntry } from "./types";

interface TimelineAPIEntry {
  period_from: string;
  period_to: string;
  month: number;
  year: number;
  label: string;
  score: number | null;
  feedback_id: string | null;
}

interface UseClientFeedbackTimelineParams {
  startDate: Date;
  endDate: Date;
}

export function useClientFeedbackTimeline({
  startDate,
  endDate,
}: UseClientFeedbackTimelineParams) {
  const projectId = useProjectDetail((s) => s.projectId);

  const { data, isLoading, error } = useFrappeGetCall<{
    message: TimelineAPIEntry[];
  }>("next_pms.next_projects.api.feedback.get_project_feedback_timeline", {
    project: projectId,
    from: startDate,
    to: endDate,
  });

  const months = useMemo((): MonthEntry[] => {
    return (data?.message ?? []).map((entry) => ({
      month: entry.month,
      year: entry.year,
      score: entry.score,
      feedback_id: entry.feedback_id,
    }));
  }, [data]);

  return { months, isLoading, error };
}
