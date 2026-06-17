/**
 * External dependencies.
 */
import type { ProjectGroup } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { AllocationRefreshTargets, AllocationsDuration } from "../types";

export interface AllocationsProjectContextProps {
  state: {
    projects: ProjectGroup[];
    isQueryLoading: boolean;
    isNextPageLoading: boolean;
    hasMore: boolean;
    searchInput: string;
    duration: AllocationsDuration;
    allocationsType: string[];
    compositeFilters: FilterCondition[];
    weekCount: number;
    anchorDate: Date;
  };
  actions: {
    setSearch: (value: string) => void;
    setDuration: (value: AllocationsDuration) => void;
    setAllocationsType: (value: string[]) => void;
    setCompositeFilters: (value: FilterCondition[]) => void;
    loadMore: () => void;
    handlePrevious: () => void;
    handleNext: () => void;
    handleToday: () => void;
    refresh: (targets?: AllocationRefreshTargets) => Promise<void>;
  };
}

export const AllocationsProjectContext =
  createContext<AllocationsProjectContextProps>({
    state: {
      projects: [],
      isQueryLoading: false,
      isNextPageLoading: false,
      hasMore: true,
      searchInput: "",
      duration: "this-quarter",
      allocationsType: [],
      compositeFilters: [],
      weekCount: 13,
      anchorDate: new Date(),
    },
    actions: {
      setSearch: () => null,
      setDuration: () => null,
      setAllocationsType: () => null,
      setCompositeFilters: () => null,
      loadMore: () => null,
      handlePrevious: () => null,
      handleNext: () => null,
      handleToday: () => null,
      refresh: async () => undefined,
    },
  });

export function useAllocationsProject<T>(
  selector: (value: AllocationsProjectContextProps) => T,
): T {
  return useContextSelector(AllocationsProjectContext, selector);
}
