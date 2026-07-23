/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { RagDetails } from "./types";
import { useProjectDetail } from "../../context";

export function useProjectRagDetails() {
  const projectId = useProjectDetail((s) => s.projectId);

  const { data, isLoading, isValidating, error, mutate } = useFrappeGetCall<{
    message: RagDetails;
  }>("rtcamp.api.project_rag.get_project_rag_details", { project: projectId });

  return { details: data?.message, isLoading, isValidating, error, mutate };
}
