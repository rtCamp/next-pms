/**
 * External dependencies.
 */
import { useCallback } from "react";
import type { PropsWithChildren } from "react";
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import {
  ProjectDetailContext,
  type ProjectDetailContextProps,
  type RepositoryInput,
} from "./context";
import type { ProjectDoc } from "./types";

interface ProjectDetailProviderProps extends PropsWithChildren {
  projectId: string;
}

export function ProjectDetailProvider({
  projectId,
  children,
}: ProjectDetailProviderProps) {
  const { data, isLoading, error, mutate } = useFrappeGetDoc<ProjectDoc>(
    "Project",
    projectId,
  );

  const { updateDoc } = useFrappeUpdateDoc();

  const updateRepositories = useCallback(
    async (repositories: RepositoryInput[]) => {
      await updateDoc("Project", projectId, {
        custom_project_repository_connections: repositories,
      });
      mutate();
    },
    [updateDoc, projectId, mutate],
  );

  const value: ProjectDetailContextProps = {
    projectId,
    project: data,
    isLoading,
    error: error ?? null,
    mutate,
    updateRepositories,
  };

  return (
    <ProjectDetailContext.Provider value={value}>
      {children}
    </ProjectDetailContext.Provider>
  );
}
