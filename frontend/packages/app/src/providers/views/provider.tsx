/**
 * External dependencies.
 */
import { FC, PropsWithChildren, useCallback, useMemo, useState } from "react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import CreateViewModal from "@/components/create-view";
import type { View } from "@/types";
import { ViewsContext } from ".";

export const ViewsProvider: FC<PropsWithChildren<{ doctype: string }>> = ({
  doctype,
  children,
}) => {
  const [isCreateViewModal, setIsCreateViewModal] = useState(false);
  const [type, settype] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const { data, isLoading, mutate } = useFrappeGetCall<{ message: View[] }>(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.get_view",
    { dt: doctype },
  );

  const views = useMemo(() => data?.message ?? [], [data]);

  const { call: createViewCall } = useFrappePostCall(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.create_view",
  );
  const { call: updateViewCall } = useFrappePostCall(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view",
  );

  const createView = useCallback(
    (args?: { type?: string; filters?: Record<string, unknown> }) => {
      if (args?.type) {
        settype(args.type);
      }
      setFilters(args?.filters ?? {});
      setIsCreateViewModal(true);
    },
    [],
  );

  const _createView = useCallback(
    async ({
      name,
      label,
      icon,
      isPublic,
    }: {
      name: string;
      label: string;
      icon: string;
      isPublic: boolean;
    }) => {
      await createViewCall({
        view: {
          name: name,
          label: label,
          public: isPublic ? 1 : 0,
          icon: icon,
          doctype: doctype,
          type: type,
          filters: filters,
        },
      });
      await mutate();
    },
    [createViewCall, mutate, doctype, type, filters],
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
      state: { doctype, views, isLoading },
      actions: { createView, updateView, refresh },
    }),
    [doctype, views, isLoading, createView, updateView, refresh],
  );

  return (
    <ViewsContext.Provider value={value}>
      {children}
      <CreateViewModal
        open={isCreateViewModal}
        onOpenChange={setIsCreateViewModal}
        createView={_createView}
      />
    </ViewsContext.Provider>
  );
};
