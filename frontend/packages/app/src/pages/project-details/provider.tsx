/**
 * External dependencies.
 */
import type { PropsWithChildren } from "react";
import { useFrappeGetDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import {
  ProjectDetailContext,
  type ProjectDetailContextProps,
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

  const value: ProjectDetailContextProps = {
    projectId,
    project: data,
    isLoading,
    error: error ?? null,
    mutate,
  };

  return (
    <ProjectDetailContext.Provider value={value}>
      {children}
    </ProjectDetailContext.Provider>
  );
}
