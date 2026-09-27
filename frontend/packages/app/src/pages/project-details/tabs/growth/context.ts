/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { DEFAULT_GROWTH_FILTERS } from "./constants";
import type {
  GrowthFilters,
  GrowthInitiativeItem,
  GrowthSort,
  GrowthStatusDoc,
  NamedDoc,
  UserDetailsMap,
} from "./types";

export interface GrowthContextProps {
  state: {
    data: GrowthInitiativeItem[];
    isLoading: boolean;
    error: unknown;
    filters: GrowthFilters;
    sort: GrowthSort | null;
    activityOwnersWithDetails: UserDetailsMap;
    ideationOwnersWithDetails: UserDetailsMap;
    isCreateOpen: boolean;
    editName: string | null;
    deleteName: string | null;
    statuses: GrowthStatusDoc[];
    closedStatuses: NamedDoc[];
    categories: NamedDoc[];
    isMastersLoading: boolean;
  };
  actions: {
    setFilters: (filters: Partial<GrowthFilters>) => void;
    setSort: (sort: GrowthSort | null) => void;
    refresh: () => void;
    openCreate: () => void;
    closeCreate: () => void;
    openEdit: (name: string) => void;
    openDetail: (name: string) => void;
    openDelete: (name: string) => void;
    closeDelete: () => void;
    deleteGrowth: (name: string) => Promise<void>;
  };
}

const noop = () => {};

export const GrowthContext = createContext<GrowthContextProps>({
  state: {
    data: [],
    isLoading: false,
    error: null,
    filters: DEFAULT_GROWTH_FILTERS,
    sort: null,
    activityOwnersWithDetails: {},
    ideationOwnersWithDetails: {},
    isCreateOpen: false,
    editName: null,
    deleteName: null,
    statuses: [],
    closedStatuses: [],
    categories: [],
    isMastersLoading: false,
  },
  actions: {
    setFilters: noop,
    setSort: noop,
    refresh: noop,
    openCreate: noop,
    closeCreate: noop,
    openEdit: noop,
    openDetail: noop,
    openDelete: noop,
    closeDelete: noop,
    deleteGrowth: async () => {},
  },
});

export const useGrowth = <T>(selector: (state: GrowthContextProps) => T) =>
  useContextSelector(GrowthContext, selector);
