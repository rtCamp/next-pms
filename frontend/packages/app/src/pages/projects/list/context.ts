/**
 * External dependencies.
 */
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { Phase, ProjectListItem } from "./types";

export type RagStatus = "red" | "amber" | "green";
export type ProjectStatus = "Open" | "Completed" | "Cancelled";

export interface ProjectListFilters {
  search: string;
  ragStatus: RagStatus | undefined;
  phase: Phase | undefined;
  status: ProjectStatus | undefined;
  advanced: FilterCondition[];
}

export const initialProjectListFilters: ProjectListFilters = {
  search: "",
  ragStatus: undefined,
  phase: undefined,
  status: undefined,
  advanced: [],
};

export interface ProjectListContextProps {
  state: {
    filters: ProjectListFilters;
    data: ProjectListItem[];
    totalCount: number;
    hasMore: boolean;
    isLoading: boolean;
    error: unknown;
  };
  actions: {
    setSearch: (search: string) => void;
    setRagStatus: (ragStatus: RagStatus | undefined) => void;
    setPhase: (phase: Phase | undefined) => void;
    setStatus: (status: ProjectStatus | undefined) => void;
    setAdvanced: (advanced: FilterCondition[]) => void;
    resetFilters: () => void;
  };
}

const noop = () => {};

export const ProjectListContext = createContext<ProjectListContextProps>({
  state: {
    filters: initialProjectListFilters,
    data: [],
    totalCount: 0,
    hasMore: false,
    isLoading: false,
    error: null,
  },
  actions: {
    setSearch: noop,
    setRagStatus: noop,
    setPhase: noop,
    setStatus: noop,
    setAdvanced: noop,
    resetFilters: noop,
  },
});

export const useProjectList = <T>(
  selector: (state: ProjectListContextProps) => T,
) => useContextSelector(ProjectListContext, selector);
