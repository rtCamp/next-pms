/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useFrappeGetCall, useFrappeUpdateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { kebabToTitleCase } from "@/lib/utils";

import AddProjectModal from "../components/add-project";
import type { AddProjectFormValues } from "../components/add-project/schema";
import { useProjectFilters } from "../hooks/useProjectFilters";
import type { Phase } from "../types";
import { buildListFrappeFilters } from "../utils";
import {
  ProjectKanbanContext,
  type ProjectKanbanContextProps,
} from "./context";
import type { ResponseProjectKanban } from "./types";

export function ProjectKanbanProvider({ children }: PropsWithChildren) {
  const { filters } = useProjectFilters();
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addProjectPrefill, setAddProjectPrefill] = useState<
    Partial<AddProjectFormValues> | undefined
  >(undefined);
  const openAddProjectModal = useCallback(
    (prefill?: Partial<AddProjectFormValues>) => {
      setAddProjectPrefill(prefill);
      setAddProjectOpen(true);
    },
    [],
  );
  const closeAddProjectModal = useCallback(() => {
    setAddProjectOpen(false);
    setAddProjectPrefill(undefined);
  }, []);

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
        addProjectOpen,
      },
      actions: {
        updateProjectPhase,
        openAddProjectModal,
        closeAddProjectModal,
      },
    }),
    [
      message,
      isLoading,
      error,
      updateProjectPhase,
      addProjectOpen,
      openAddProjectModal,
      closeAddProjectModal,
    ],
  );

  return (
    <ProjectKanbanContext.Provider value={value}>
      {children}
      <AddProjectModal
        open={addProjectOpen}
        onOpenChange={(next) => {
          if (next) {
            setAddProjectOpen(true);
          } else {
            closeAddProjectModal();
          }
        }}
        prefill={addProjectPrefill}
        onSuccess={() => mutate()}
      />
    </ProjectKanbanContext.Provider>
  );
}
