/**
 * External dependencies.
 */
import { useMemo } from "react";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "@/pages/project-details/context";
import {
  useCommentThread,
  type CommentThreadMethods,
} from "@/pages/project-details/useCommentThread";

const FEEDBACK_COMMENT_METHODS: CommentThreadMethods = {
  list: "next_pms.next_projects.api.feedback.get_feedback_comments",
  add: "next_pms.next_projects.api.feedback.add_comment_to_feedback",
  update: "next_pms.next_projects.api.feedback.update_comment_in_feedback",
  remove: "next_pms.next_projects.api.feedback.delete_comment_from_feedback",
};

export function useFeedbackComments(feedbackName: string) {
  const projectId = useProjectDetail((s) => s.projectId);
  const listParams = useMemo(
    () => ({ feedback: feedbackName }),
    [feedbackName],
  );
  const addParams = useMemo(
    () => ({ feedback: feedbackName, project: projectId }),
    [feedbackName, projectId],
  );

  return useCommentThread(FEEDBACK_COMMENT_METHODS, listParams, addParams);
}
