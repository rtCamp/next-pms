/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { EmployeeOnLeave } from "../../types";

export interface UpcomingTimeOffContextProps {
  leaves: EmployeeOnLeave[];
  pendingCount: number;
  isLoading: boolean;
  approveLeave: (name: string) => Promise<void>;
}

export const UpcomingTimeOffContext =
  createContext<UpcomingTimeOffContextProps>({
    leaves: [],
    pendingCount: 0,
    isLoading: true,
    approveLeave: async () => undefined,
  });

export const useUpcomingTimeOff = <T>(
  selector: (state: UpcomingTimeOffContextProps) => T,
) => useContextSelector(UpcomingTimeOffContext, selector);
