/**
 * External dependencies.
 */
import { useMemo } from "react";
import type { FilterCondition, FilterField } from "@rtcamp/frappe-ui-react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "@/pages/project-details/context";
import type { Note } from "./types";

const hasSupportedAuthorOperator = (condition: FilterCondition): boolean => {
  const operator = String(condition.operator ?? "").toLowerCase();
  return !operator || operator === "is" || operator === "equals";
};

const extractAuthor = (advanced: FilterCondition[]): string | undefined => {
  const cond = advanced.find(
    (f) => f.field === "author" && f.value && hasSupportedAuthorOperator(f),
  );
  if (!cond?.value) return undefined;
  return Array.isArray(cond.value) ? cond.value[0] : String(cond.value);
};

const applyAuthorFilter = (
  notes: Note[],
  advanced: FilterCondition[],
): Note[] => {
  const cond = advanced.find((f) => f.field === "author");
  if (!cond) return notes;

  const op = String(cond.operator ?? "").toLowerCase();
  const val = Array.isArray(cond.value)
    ? cond.value[0]
    : String(cond.value ?? "");

  switch (op) {
    case "is":
    case "equals":
      // already handled server-side
      return notes;
    case "is_not":
      return notes.filter((n) => n.owner !== val);
    case "is_empty":
      return notes.filter((n) => !n.owner);
    case "is_not_empty":
      return notes.filter((n) => Boolean(n.owner));
    default:
      return notes;
  }
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
  }>(
    "next_pms.timesheet.api.project_status_update.get_project_status_updates_by_project",
    params,
    swrKey,
  );

  const allNotes = useMemo(() => {
    const raw = data?.message;
    if (!Array.isArray(raw)) return [];
    return [...raw]
      .filter((n) => n.status === "Publish")
      .sort((a, b) => b.creation.localeCompare(a.creation));
  }, [data]);

  const notes = useMemo(
    () => applyAuthorFilter(allNotes, advanced),
    [allNotes, advanced],
  );

  const filterFields = useMemo<FilterField[]>(() => {
    const seen = new Set<string>();
    const authorOptions = allNotes
      .filter((n) => {
        if (seen.has(n.owner)) return false;
        seen.add(n.owner);
        return true;
      })
      .map((n) => ({ label: n.owner_full_name || n.owner, value: n.owner }));
    return [
      {
        name: "author",
        label: "Author",
        type: "select",
        options: authorOptions,
      },
    ];
  }, [allNotes]);

  return { notes, filterFields, isLoading, error, mutate };
}
