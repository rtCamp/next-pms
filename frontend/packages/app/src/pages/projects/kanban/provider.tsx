/**
 * External dependencies.
 */
import { useCallback, useMemo, type PropsWithChildren } from "react";
import { useFrappeGetCall, useFrappeUpdateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { kebabToTitleCase } from "@/lib/utils";

import { PROJECT_LIST_PAGE_SIZE } from "../constants";
import { buildListFrappeFilters, useProjectFilter } from "../context";
import type { Phase } from "../types";
import {
  ProjectKanbanContext,
  type ProjectKanbanContextProps,
} from "./context";
import type { ResponseProjectKanban } from "./types";

export function ProjectKanbanProvider({ children }: PropsWithChildren) {
  const filters = useProjectFilter((c) => c.state.filters);

  const frappeFilters = useMemo(
    () => buildListFrappeFilters(filters),
    [filters],
  );

  const { data, error, isLoading, mutate } =
    useFrappeGetCall<ResponseProjectKanban>(
      "next_pms.next_projects.api.project.get_projects_view",
      {
        view: "kanban",
        search: filters.search,
        filters: frappeFilters,
        start: 0,
        limit: PROJECT_LIST_PAGE_SIZE,
      },
    );

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
