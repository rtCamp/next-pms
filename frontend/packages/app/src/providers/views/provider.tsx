/**
 * External dependencies.
 */
import { FC, PropsWithChildren, useCallback, useMemo } from "react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { View } from "@/types";
import { ViewsContext } from ".";

export const ViewsProvider: FC<PropsWithChildren> = ({ children }) => {
  const { data, isLoading, mutate } = useFrappeGetCall<View[]>(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.get_views",
  );

  const views = useMemo(() => data ?? [], [data]);

  const { call: createViewCall } = useFrappePostCall(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.create_view",
  );
  const { call: updateViewCall } = useFrappePostCall(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view",
  );

  const getViewsForDoctype = useCallback(
    (dt: string) => views.filter((view) => view.dt === dt),
    [views],
  );

  const createView = useCallback(
    async (view: Partial<View>) => {
      await createViewCall({ view });
      await mutate();
    },
    [createViewCall, mutate],
  );

  const updateView = useCallback(
    async (view: Partial<View>) => {
      await updateViewCall({ view });
      await mutate();
    },
    [updateViewCall, mutate],
  );

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const value = useMemo(
    () => ({
      state: { views, isLoading },
      actions: { getViewsForDoctype, createView, updateView, refresh },
    }),
    [views, isLoading, getViewsForDoctype, createView, updateView, refresh],
  );

  return (
    <ViewsContext.Provider value={value}>{children}</ViewsContext.Provider>
  );
};
