import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

import { useProjectDetail } from "@/pages/project-details/context";
import type { Note } from "./types";

const NOTES_API =
  "next_pms.timesheet.api.project_status_update.get_project_status_updates_by_project";

const extractAuthor = (advanced: FilterCondition[]): string | undefined => {
  const cond = advanced.find((f) => f.field === "author" && f.value);
  if (!cond?.value) return undefined;
  return Array.isArray(cond.value) ? cond.value[0] : String(cond.value);
};

export function useNotesData(advanced: FilterCondition[]) {
  const projectId = useProjectDetail((s) => s.projectId);

  const author = useMemo(() => extractAuthor(advanced), [advanced]);

  const params = useMemo(
    () => ({ project: projectId, ...(author ? { author } : {}) }),
    [projectId, author],
  );

  const swrKey = useMemo(
    () => (projectId ? `notes-${projectId}-${author ?? ""}` : null),
    [projectId, author],
  );

  const { data, isLoading, error, mutate } = useFrappeGetCall<{
    message: Note[];
  }>(NOTES_API, params, swrKey);

  const notes = useMemo(() => {
    const raw = data?.message;
    if (!Array.isArray(raw)) return [];
    return [...raw]
      .filter((n) => n.status === "Publish")
      .sort((a, b) => b.creation.localeCompare(a.creation));
  }, [data]);

  return { notes, isLoading, error, mutate };
}
