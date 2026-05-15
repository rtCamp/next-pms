/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { useFrappeGetCall, useFrappeUpdateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { kebabToTitleCase } from "@/lib/utils";

import {
  ProjectListContext,
  initialProjectListFilters,
  type ProjectListContextProps,
  type ProjectListFilters,
  type ProjectStatus,
  type RagStatus,
} from "./context";
import type { Phase, ResponseProject } from "./types";

const buildListFrappeFilters = (filters: ProjectListFilters) => {
  const out: unknown[] = [];
  if (filters.ragStatus) {
    out.push(["custom_project_rag_status", "=", filters.ragStatus]);
  }
  if (filters.phase) {
    out.push(["custom_project_phase", "=", filters.phase]);
  }
  if (filters.status) {
    out.push(["status", "=", filters.status]);
  }
  return out;
};

export function ProjectListProvider({ children }: PropsWithChildren) {
  const [filters, setFilters] = useState<ProjectListFilters>(
    initialProjectListFilters,
  );

  const frappeFilters = useMemo(
    () => buildListFrappeFilters(filters),
    [filters],
  );

  const { data, error, isLoading, mutate } = useFrappeGetCall<ResponseProject>(
    "next_pms.next_projects.api.project.get_projects_view",
    {
      search: filters.search,
      filters: frappeFilters,
    },
  );

  const setSearch = useCallback(
    (search: string) => setFilters((f) => ({ ...f, search })),
    [],
  );
  const setRagStatus = useCallback(
    (ragStatus: RagStatus | undefined) =>
      setFilters((f) => ({ ...f, ragStatus })),
    [],
  );
  const setPhase = useCallback(
    (phase: Phase | undefined) => setFilters((f) => ({ ...f, phase })),
    [],
  );
  const setStatus = useCallback(
    (status: ProjectStatus | undefined) =>
      setFilters((f) => ({ ...f, status })),
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

  const { updateDoc } = useFrappeUpdateDoc();
  const updateProjectPhase = useCallback(
    async (projectId: string, phase: Phase) => {
      await updateDoc("Project", projectId, {
        custom_project_phase: kebabToTitleCase(phase),
      });
      mutate();
    },
    [updateDoc],
  );

  const value: ProjectListContextProps = useMemo(
    () => ({
      state: {
        filters,
        data: data?.message.data ?? [],
        totalCount: data?.message.total_count ?? 0,
        hasMore: data?.message.has_more ?? false,
        isLoading,
        error,
      },
      actions: {
        setSearch,
        setRagStatus,
        setPhase,
        setStatus,
        setAdvanced,
        resetFilters,
        updateProjectPhase,
      },
    }),
    [
      filters,
      data,
      isLoading,
      error,
      setSearch,
      setRagStatus,
      setPhase,
      setStatus,
      setAdvanced,
      resetFilters,
      updateProjectPhase,
    ],
  );

  return (
    <ProjectListContext.Provider value={value}>
      {children}
    </ProjectListContext.Provider>
  );
}
