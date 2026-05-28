/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { NotesFilters } from "./types";

const parseAdvanced = (raw: string | null): FilterCondition[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FilterCondition[]) : [];
  } catch {
    return [];
  }
};

export function useNotesFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: NotesFilters = useMemo(
    () => ({ advanced: parseAdvanced(searchParams.get("notesAdvanced")) }),
    [searchParams],
  );

  const setAdvanced = useCallback(
    (v: FilterCondition[]) =>
      setSearchParams(
        (prev) => {
          if (v.length) prev.set("notesAdvanced", JSON.stringify(v));
          else prev.delete("notesAdvanced");
          return prev;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  return { filters, setAdvanced };
}
