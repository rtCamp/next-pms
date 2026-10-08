/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "@/pages/project-details/context";
import { TODO_API } from "./constants";
import type { LinkedRecord } from "./types";

const NO_RECORDS: LinkedRecord[] = [];

export function useLinkableRecords(enabled: boolean) {
  const projectId = useProjectDetail((s) => s.projectId);

  const { data, isLoading } = useFrappeGetCall<{ message: LinkedRecord[] }>(
    `${TODO_API}.get_linkable_records`,
    { project: projectId },
    enabled && projectId ? undefined : null,
    { revalidateOnFocus: false },
  );

  return { records: data?.message ?? NO_RECORDS, isLoading };
}
