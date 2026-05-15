/**
 * External dependencies.
 */
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { Phase } from "./types";

export type RagStatus = "red" | "amber" | "green";
export type ProjectStatus = "Open" | "Completed" | "Cancelled";

export interface ProjectListFilters {
  search: string;
  ragStatus: RagStatus | "";
  phase: Phase | "";
  status: ProjectStatus | "";
  advanced: FilterCondition[];
}

export const initialProjectListFilters: ProjectListFilters = {
  search: "",
  ragStatus: "",
  phase: "",
  status: "",
  advanced: [],
};

export const buildListFrappeFilters = (filters: ProjectListFilters) => {
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

export interface ProjectFilterContextProps {
  state: {
    filters: ProjectListFilters;
  };
  actions: {
    setSearch: (search: string) => void;
    setRagStatus: (ragStatus: RagStatus | "") => void;
    setPhase: (phase: Phase | "") => void;
    setStatus: (status: ProjectStatus | "") => void;
    setAdvanced: (advanced: FilterCondition[]) => void;
    resetFilters: () => void;
  };
}

const noop = () => {};

export const ProjectFilterContext = createContext<ProjectFilterContextProps>({
  state: {
    filters: initialProjectListFilters,
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

export const useProjectFilter = <T>(
  selector: (state: ProjectFilterContextProps) => T,
) => useContextSelector(ProjectFilterContext, selector);
