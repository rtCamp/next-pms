/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { KanbanColumn, KanbanProjectItem } from "./types";
import { Phase } from "../types";

export type UpdateProjectPhase = (
  projectId: string,
  phase: Phase,
) => Promise<void>;

export interface ProjectKanbanContextProps {
  state: {
    data: {
      columns: KanbanColumn[];
      data: Record<string, KanbanProjectItem[]>;
      total_count: number;
    };
    isLoading: boolean;
    error: unknown;
  };
  actions: {
    updateProjectPhase: UpdateProjectPhase;
  };
}

export const ProjectKanbanContext = createContext<ProjectKanbanContextProps>({
  state: {
    data: {
      columns: [],
      data: {},
      total_count: 0,
    },
    isLoading: false,
    error: null,
  },
  actions: {
    updateProjectPhase: async () => {},
  },
});

export const useProjectKanban = <T>(
  selector: (state: ProjectKanbanContextProps) => T,
) => useContextSelector(ProjectKanbanContext, selector);
