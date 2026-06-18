/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

export interface LeadershipViewContextProps {
  state: {};
  actions: {};
}

export const LeadershipViewContext = createContext<LeadershipViewContextProps>({
  state: {},
  actions: {},
});

export const useLeadershipView = <T>(
  selector: (state: LeadershipViewContextProps) => T,
) => useContextSelector(LeadershipViewContext, selector);
