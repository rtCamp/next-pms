/**
 * External dependencies.
 */
import { useMemo, type PropsWithChildren } from "react";

import {
  LeadershipViewContext,
  type LeadershipViewContextProps,
} from "./context";

export function LeadershipViewProvider({ children }: PropsWithChildren) {
  const value: LeadershipViewContextProps = useMemo(
    () => ({
      state: {},
      actions: {},
    }),
    [],
  );

  return (
    <LeadershipViewContext.Provider value={value}>
      {children}
    </LeadershipViewContext.Provider>
  );
}
