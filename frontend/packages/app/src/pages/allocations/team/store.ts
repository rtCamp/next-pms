import type { Member } from "@next-pms/design-system/components";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { FAKE_MEMBERS, GANTT_START_DATE } from "./constants";

const DURATION_WEEK_COUNT: Record<string, number> = {
  "this-week": 1,
  "this-month": 4,
  "this-quarter": 13,
  "all-time": 100,
};

interface AllocationsTeamState {
  // data
  members: Member[];
  startDate: Date;
  // filters
  search: string;
  allocationsType: string | undefined;
  duration: string;
  compositeFilters: FilterCondition[];
  // derived
  weekCount: number;
  filteredMembers: Member[];
  // async state
  isLoading: boolean;
  // actions
  setSearch: (search: string) => void;
  setAllocationsType: (type: string | undefined) => void;
  setDuration: (duration: string) => void;
  setCompositeFilters: (filters: FilterCondition[]) => void;
  setMembers: (members: Member[]) => void;
  fetchData: () => Promise<void>;
}

function applyFilter(members: Member[], search: string): Member[] {
  if (!search.trim()) return members;
  const lower = search.toLowerCase();
  return members.filter(
    (m) =>
      m.name.toLowerCase().includes(lower) ||
      m.role?.toLowerCase().includes(lower),
  );
}

export const useAllocationsTeam = create<AllocationsTeamState>()((set) => ({
  // data
  members: FAKE_MEMBERS,
  startDate: GANTT_START_DATE,
  // filters
  search: "",
  allocationsType: undefined,
  duration: "this-quarter",
  compositeFilters: [],
  // derived
  weekCount: DURATION_WEEK_COUNT["this-quarter"],
  filteredMembers: FAKE_MEMBERS,
  // async state
  isLoading: false,

  // actions
  setSearch: (search) =>
    set((state) => ({
      search,
      filteredMembers: applyFilter(state.members, search),
    })),

  setAllocationsType: (allocationsType) => set({ allocationsType }),

  setDuration: (duration) =>
    set({
      duration,
      weekCount:
        DURATION_WEEK_COUNT[duration] ?? DURATION_WEEK_COUNT["this-quarter"],
    }),

  setCompositeFilters: (compositeFilters) => set({ compositeFilters }),

  setMembers: (members) =>
    set((state) => ({
      members,
      filteredMembers: applyFilter(members, state.search),
    })),

  fetchData: async () => {
    set({ isLoading: true });
    try {
      // TODO: replace with real API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      const data: Member[] = FAKE_MEMBERS;
      set((state) => ({
        members: data,
        filteredMembers: applyFilter(data, state.search),
      }));
    } finally {
      set({ isLoading: false });
    }
  },
}));

export function useAllocationsTeamShallow<T>(
  selector: (state: AllocationsTeamState) => T,
): T {
  return useAllocationsTeam(useShallow(selector));
}
