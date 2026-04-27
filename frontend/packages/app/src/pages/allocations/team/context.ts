/**
 * External dependencies.
 */
import type { Member } from "@next-pms/design-system/components";
import { createContext, useContextSelector } from "use-context-selector";

export type AllocationsDuration =
  | "this-week"
  | "this-month"
  | "this-quarter"
  | "all-time";

export interface AllocationsTeamContextProps {
  state: {
    members: Member[];
    filteredMembers: Member[];
    isLoading: boolean;
    hasMore: boolean;
    totalCount: number;
    searchInput: string;
    duration: AllocationsDuration;
    weekCount: number;
    anchorDate: Date;
  };
  actions: {
    setSearch: (value: string) => void;
    setDuration: (value: AllocationsDuration) => void;
    loadMore: () => void;
    handlePrevious: () => void;
    handleNext: () => void;
    handleToday: () => void;
    refresh: () => Promise<void>;
  };
}

export const AllocationsTeamContext =
  createContext<AllocationsTeamContextProps>({
    state: {
      members: [],
      filteredMembers: [],
      isLoading: false,
      hasMore: true,
      totalCount: 0,
      searchInput: "",
      duration: "this-quarter",
      weekCount: 13,
      anchorDate: new Date(),
    },
    actions: {
      setSearch: () => null,
      setDuration: () => null,
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
