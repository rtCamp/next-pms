/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "@/pages/project-details/context";
import { TODO_API } from "./constants";
import type { LinkedRecord, RecordRef } from "./types";
import { isSameRecord } from "./utils";

const NO_RECORDS: LinkedRecord[] = [];

export function useLinkableRecords(enabled = true) {
  const projectId = useProjectDetail((s) => s.projectId);

  const { data, isLoading } = useFrappeGetCall<{ message: LinkedRecord[] }>(
    `${TODO_API}.get_linkable_records`,
    { project: projectId },
    enabled && projectId ? ["linkable-records", projectId] : null,
    { revalidateOnFocus: false },
  );

  const records = data?.message ?? NO_RECORDS;
  const canLink = (record?: RecordRef | null) =>
    records.some((r) => isSameRecord(r, record));

  return { records, isLoading, canLink };
}
