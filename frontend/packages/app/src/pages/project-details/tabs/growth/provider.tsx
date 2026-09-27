/**
 * External dependencies.
 */
import { useCallback, useMemo, type PropsWithChildren } from "react";

/**
 * Internal dependencies.
 */
import { GrowthContext, type GrowthContextProps } from "./context";
import { useGrowthData } from "./useGrowthData";

export function GrowthProvider({ children }: PropsWithChildren) {
  const { data, isLoading, error, mutate } = useGrowthData();

  const refresh = useCallback(() => {
    void mutate();
  }, [mutate]);

  const value = useMemo<GrowthContextProps>(
    () => ({
      state: { data, isLoading, error },
      actions: { refresh },
    }),
    [data, isLoading, error, refresh],
  );

  return (
    <GrowthContext.Provider value={value}>{children}</GrowthContext.Provider>
  );
}
