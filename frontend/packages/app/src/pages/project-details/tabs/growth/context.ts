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
  };
  actions: {
    setFilters: (filters: Partial<GrowthFilters>) => void;
    setSort: (sort: GrowthSort | null) => void;
    refresh: () => void;
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
  },
  actions: { setFilters: noop, setSort: noop, refresh: noop },
});

export const useGrowth = <T>(selector: (state: GrowthContextProps) => T) =>
  useContextSelector(GrowthContext, selector);
