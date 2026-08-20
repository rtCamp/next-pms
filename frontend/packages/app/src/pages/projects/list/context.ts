/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { ProjectListItem } from "./types";

export interface ProjectListContextProps {
  state: {
    data: ProjectListItem[];
    hasMore: boolean;
    isLoading: boolean;
    error: unknown;
  };
  actions: {
    loadMore: () => void;
  };
}

const noop = () => {};

export const ProjectListContext = createContext<ProjectListContextProps>({
  state: {
    data: [],
    hasMore: false,
    isLoading: false,
    error: null,
  },
  actions: {
    loadMore: noop,
  },
});

export const useProjectList = <T>(
  selector: (state: ProjectListContextProps) => T,
) => useContextSelector(ProjectListContext, selector);
