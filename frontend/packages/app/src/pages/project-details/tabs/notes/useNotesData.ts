/**
 * External dependencies.
 */
import { useMemo } from "react";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "@/pages/project-details/context";
import type { Note } from "./types";

export function useNotesData({ filters }: { filters: FilterCondition[] }) {
  const projectId = useProjectDetail((s) => s.projectId);

  const { data, isLoading, error, mutate } = useFrappeGetCall<{
    message: Note[];
  }>(
    "next_pms.timesheet.api.project_status_update.get_project_status_updates_by_project",
    {
      project: projectId,
      filters: JSON.stringify(
        filters.map((f) =>
          Array.isArray(f.value)
            ? [f.field, f.operator, ...f.value]
            : [f.field, f.operator, f.value],
        ),
      ),
    },
  );

  const notes = useMemo(() => {
    const raw = data?.message;
    if (!Array.isArray(raw)) return [];
    return [...raw]
      .filter((n) => n.status === "Publish")
      .sort((a, b) => b.creation.localeCompare(a.creation));
  }, [data]);

  return { notes, isLoading, error, mutate };
}
