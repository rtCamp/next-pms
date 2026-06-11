/**
 * External dependencies.
 */
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "@/pages/project-details/context";
import type { TeamFeedbackRow } from "./types";

interface TeamFeedbackAPIRow {
  name: string;
  period_from: string;
  period_to: string;
  employee: string;
  employee_name: string;
  customer: string;
  feedback_by: string;
  contact_email: string;
  evaluation_type: string;
  average: number | null;
  stars: number | null;
  star_max: number;
  avatar_url: string;
}

interface TeamFeedbackAPIResult {
  data: TeamFeedbackAPIRow[];
  total: number;
  has_more: boolean;
}

export function useTeamFeedbackList() {
  const projectId = useProjectDetail((s) => s.projectId);

  const { data, isLoading, error } = useFrappeGetCall<{
    message: TeamFeedbackAPIResult;
  }>("next_pms.next_projects.api.feedback.get_team_feedback_list", {
    project: projectId,
  });

  const rows = useMemo((): TeamFeedbackRow[] => {
    return (data?.message?.data ?? []).map((row) => ({
      id: row.name,
      from: format(parseISO(row.period_from), "MMM d"),
      to: format(parseISO(row.period_to), "MMM d"),
      member: { name: row.employee_name, image: row.avatar_url },
      customer: { name: row.customer, image: "" },
      avgRating: row.average ?? 0,
    }));
  }, [data]);

  return { rows, isLoading, error };
}
