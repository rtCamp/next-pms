/**
 * External dependencies.
 */
import { useCallback, useMemo, type PropsWithChildren } from "react";
import { useFrappeGetCall, useFrappeUpdateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { kebabToTitleCase } from "@/lib/utils";
import {
  ProjectKanbanContext,
  type ProjectKanbanContextProps,
} from "./context";
import type { ResponseProjectKanban } from "./types";
import { useProjectFilters } from "../components/project-filters/useProjectFilters";
import { PROJECTS_VIEW_METHOD } from "../constants";

import type { Phase } from "../types";
import { buildListFrappeFilters } from "../utils";

export function ProjectKanbanProvider({ children }: PropsWithChildren) {
  const { filters } = useProjectFilters();

  const frappeFilters = useMemo(
    () => buildListFrappeFilters(filters),
    [filters],
  );

  const { data, error, isLoading, mutate } =
    useFrappeGetCall<ResponseProjectKanban>(PROJECTS_VIEW_METHOD, {
      view: "kanban",
      search: filters.search,
      filters: frappeFilters,
    });

  const message = useMemo(
    () => data?.message ?? { columns: [], data: {}, total_count: 0 },
    [data],
  );

  const { updateDoc } = useFrappeUpdateDoc();
  const updateProjectPhase = useCallback(
    async (projectId: string, phase: Phase) => {
      await updateDoc("Project", projectId, {
        custom_project_phase: kebabToTitleCase(phase),
      });
      mutate();
    },
    [updateDoc, mutate],
  );

  const value: ProjectKanbanContextProps = useMemo(
    () => ({
      state: {
        data: message,
        isLoading,
        error,
      },
      actions: {
        updateProjectPhase,
      },
    }),
    [message, isLoading, error, updateProjectPhase],
  );

  return (
    <ProjectKanbanContext.Provider value={value}>
      {children}
    </ProjectKanbanContext.Provider>
  );
}
