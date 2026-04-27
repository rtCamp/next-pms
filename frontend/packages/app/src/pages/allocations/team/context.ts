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
    searchInput: string;
    duration: AllocationsDuration;
    weekCount: number;
    anchorDate: Date;
  };
  actions: {
    setSearch: (value: string) => void;
    setDuration: (value: AllocationsDuration) => void;
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
      searchInput: "",
      duration: "this-quarter",
      weekCount: 13,
      anchorDate: new Date(),
    },
    actions: {
      setSearch: () => null,
      setDuration: () => null,
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
