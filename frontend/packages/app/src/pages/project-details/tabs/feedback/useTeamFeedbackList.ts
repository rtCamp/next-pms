/**
 * External dependencies.
 */
import { useEffect, useRef, useState } from "react";
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

const FEEDBACK_PAGE_SIZE = 20;

export function useTeamFeedbackList() {
  const projectId = useProjectDetail((s) => s.projectId);
  const [page, setPage] = useState(0);
  const [feedbackList, setFeedbackList] = useState<TeamFeedbackRow[]>([]);

  // Track the last page offset we already appended into feedbackList
  const appendedPageRef = useRef<number | null>(null);

  const { data, isLoading, error } = useFrappeGetCall<{
    message: TeamFeedbackAPIResult;
  }>("next_pms.next_projects.api.feedback.get_team_feedback_list", {
    project: projectId,
    start: page,
    limit: FEEDBACK_PAGE_SIZE,
  });

  useEffect(() => {
    // only append if we have data AND haven't already appended this page
    if (!data?.message?.data || appendedPageRef.current === page) return;

    const newRows: TeamFeedbackRow[] = data.message.data.map((row) => ({
      id: row.name,
      from: format(parseISO(row.period_from), "MMM d"),
      to: format(parseISO(row.period_to), "MMM d"),
      member: { name: row.employee_name, image: row.avatar_url },
      customer: { name: row.customer, image: "" },
      avgRating: row.average ?? 0,
    }));

    setFeedbackList((prev) => [...prev, ...newRows]);

    // Mark this page as appended
    appendedPageRef.current = page;
  }, [data, page]);

  const hasMore = data?.message.has_more ?? false;
  const loadMore = () => {
    if (hasMore) {
      setPage((prev) => prev + FEEDBACK_PAGE_SIZE);
    }
  };

  return { feedbackList, isLoading, error, hasMore, loadMore };
}
