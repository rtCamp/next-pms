/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import {
  ProjectFilterContext,
  initialProjectListFilters,
  type ProjectFilterContextProps,
  type ProjectListFilters,
  type ProjectStatus,
  type RagStatus,
} from "./context";
import type { Phase } from "./types";

export function ProjectFilterProvider({ children }: PropsWithChildren) {
  const [filters, setFilters] = useState<ProjectListFilters>(
    initialProjectListFilters,
  );

  const setSearch = useCallback(
    (search: string) => setFilters((f) => ({ ...f, search })),
    [],
  );
  const setRagStatus = useCallback(
    (ragStatus: RagStatus | "") => setFilters((f) => ({ ...f, ragStatus })),
    [],
  );
  const setPhase = useCallback(
    (phase: Phase | "") => setFilters((f) => ({ ...f, phase })),
    [],
  );
  const setStatus = useCallback(
    (status: ProjectStatus | "") => setFilters((f) => ({ ...f, status })),
    [],
  );
  const setAdvanced = useCallback(
    (advanced: FilterCondition[]) => setFilters((f) => ({ ...f, advanced })),
    [],
  );
  const resetFilters = useCallback(
    () => setFilters(initialProjectListFilters),
    [],
  );

  const value: ProjectFilterContextProps = useMemo(
    () => ({
      state: { filters },
      actions: {
        setSearch,
        setRagStatus,
        setPhase,
        setStatus,
        setAdvanced,
        resetFilters,
      },
    }),
    [
      filters,
      setSearch,
      setRagStatus,
      setPhase,
      setStatus,
      setAdvanced,
      resetFilters,
    ],
  );

  return (
    <ProjectFilterContext.Provider value={value}>
      {children}
    </ProjectFilterContext.Provider>
  );
}
