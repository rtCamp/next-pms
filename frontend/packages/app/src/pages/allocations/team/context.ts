/**
 * External dependencies.
 */
import type { Member } from "@next-pms/design-system/components";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { AllocationRefreshTargets, AllocationsDuration } from "../types";

export interface AllocationsTeamContextProps {
  state: {
    members: Member[];
    isQueryLoading: boolean;
    isNextPageLoading: boolean;
    hasMore: boolean;
    designation: string[];
    searchInput: string;
    duration: AllocationsDuration;
    weekCount: number;
    anchorDate: Date;
  };
  actions: {
    setSearch: (value: string) => void;
    setDuration: (value: AllocationsDuration) => void;
    setDesignation: (value: string[]) => void;
    loadMore: () => void;
    handlePrevious: () => void;
    handleNext: () => void;
    handleToday: () => void;
    refresh: (targets?: AllocationRefreshTargets) => Promise<void>;
  };
}

export const AllocationsTeamContext =
  createContext<AllocationsTeamContextProps>({
    state: {
      members: [],
      isQueryLoading: false,
      isNextPageLoading: false,
      hasMore: true,
      searchInput: "",
      duration: "this-quarter",
      designation: [],
      weekCount: 13,
      anchorDate: new Date(),
    },
    actions: {
      setSearch: () => null,
      setDuration: () => null,
      setDesignation: () => null,
      loadMore: () => null,
      handlePrevious: () => null,
      handleNext: () => null,
      handleToday: () => null,
      refresh: async () => undefined,
    },
  });

export function useAllocationsTeam<T>(
  selector: (value: AllocationsTeamContextProps) => T,
): T {
  return useContextSelector(AllocationsTeamContext, selector);
}
