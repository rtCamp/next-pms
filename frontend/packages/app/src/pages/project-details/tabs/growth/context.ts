/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { GrowthInitiativeItem } from "./types";

export interface GrowthContextProps {
  state: {
    data: GrowthInitiativeItem[];
    isLoading: boolean;
    error: unknown;
  };
  actions: {
    refresh: () => void;
  };
}

export const GrowthContext = createContext<GrowthContextProps>({
  state: { data: [], isLoading: false, error: null },
  actions: { refresh: () => {} },
});

export const useGrowth = <T>(selector: (state: GrowthContextProps) => T) =>
  useContextSelector(GrowthContext, selector);
