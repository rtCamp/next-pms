/**
 * External dependencies.
 */
import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  FrappeError,
  useFrappeDeleteDoc,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import CreateViewModal from "@/components/create-view";
import EditViewModal from "@/components/edit-view";
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { View } from "@/types";
import { ViewsContext } from ".";

export const ViewsProvider: FC<
  PropsWithChildren<{
    doctype: string;
    defaultViews?: View[];
    filterParamKeys?: readonly string[];
  }>
> = ({ doctype, defaultViews, filterParamKeys, children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToasts();

  const [isCreateViewModal, setIsCreateViewModal] = useState(false);
  const [type, settype] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [editingView, setEditingView] = useState<View | null>(null);

  const { data, isLoading, mutate } = useFrappeGetCall<{ message: View[] }>(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.get_view",
    { dt: doctype },
  );

  const { call: createViewCall } = useFrappePostCall(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.create_view",
  );
  const { call: updateViewCall } = useFrappePostCall(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view",
  );
  const { deleteDoc } = useFrappeDeleteDoc();

  const savedViews = useMemo(() => data?.message ?? [], [data]);
  const views = useMemo(
    () => [...(defaultViews ?? []), ...savedViews],
    [defaultViews, savedViews],
  );

  const viewParam = searchParams.get("view");
  const activeView = views.find(({ name }) => String(name) === viewParam);

  const appliedViewName = useRef<string | null>(null);

  const applyView = useCallback(
    (view: View, options?: { replace?: boolean }) => {
      appliedViewName.current = String(view.name);
      setSearchParams(
        (params) => {
          params.set("view", String(view.name));

          filterParamKeys?.forEach((key) => {
            const value = view.filters?.[key];
            if (value === undefined || value === null) {
              params.delete(key);
            } else {
              params.set(
                key,
                typeof value === "string" ? value : JSON.stringify(value),
              );
            }
          });

          const [sort] = view.order_by ?? [];
          if (typeof sort === "string" && sort) {
            const [field, order] = sort.split(" ");
            params.set("sortField", field);
            params.set("sortOrder", order ?? "desc");
          }
          return params;
        },
        { replace: options?.replace ?? false },
      );
    },
    [setSearchParams, filterParamKeys],
  );

  useEffect(() => {
    if (isLoading || views.length === 0) {
      return;
    }
    if (!activeView) {
      const initialView = views.find((view) => view.default === 1) ?? views[0];
      applyView(initialView, { replace: true });
      return;
    }
    if (appliedViewName.current !== String(activeView.name)) {
      applyView(activeView, { replace: true });
    }
  }, [isLoading, activeView, views, applyView]);

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
          label: label,
          public: isPublic ? 1 : 0,
          icon: icon,
          dt: doctype,
          type: type,
          filters: filters,
        },
      });
      await mutate();
    },
    [createViewCall, mutate, doctype, type, filters],
  );

  const editView = useCallback((view: View) => {
    setEditingView(view);
  }, []);

  const _editView = useCallback(
    async ({
      label,
      icon,
      isPublic,
    }: {
      label: string;
      icon: string;
      isPublic: boolean;
    }) => {
      if (!editingView) {
        return;
      }
      await updateViewCall({
        view: {
          ...editingView,
          label: label,
          icon: icon,
          public: isPublic ? 1 : 0,
          dt: doctype,
        },
      });
      await mutate();
    },
    [updateViewCall, mutate, doctype, editingView],
  );

  const updateView = useCallback(
    async (view: Omit<Partial<View>, "dt">) => {
      try {
        await updateViewCall({ view: { ...view, dt: doctype } });
        await mutate();
        toast.success("View Updated");
      } catch (error) {
        const message = parseFrappeErrorMsg(error as FrappeError);
        toast.error(message);
      }
    },
    [updateViewCall, mutate, doctype],
  );

  const deleteView = useCallback(
    async (name: string) => {
      try {
        await deleteDoc("PMS View Setting", name);
        await mutate();
        toast.success("View Deleted");
      } catch (error) {
        const message = parseFrappeErrorMsg(error as FrappeError);
        toast.error(message);
      }
    },
    [toast, deleteDoc, mutate],
  );

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const value = useMemo(
    () => ({
      state: {
        doctype,
        views,
        defaultViews: defaultViews ?? [],
        savedViews,
        activeView,
        isLoading,
      },
      actions: {
        createView,
        applyView,
        editView,
        updateView,
        deleteView,
        refresh,
      },
    }),
    [
      doctype,
      views,
      defaultViews,
      savedViews,
      activeView,
      isLoading,
      createView,
      applyView,
      editView,
      updateView,
      deleteView,
      refresh,
    ],
  );

  return (
    <ViewsContext.Provider value={value}>
      {children}
      <CreateViewModal
        open={isCreateViewModal}
        onOpenChange={setIsCreateViewModal}
        createView={_createView}
      />
      <EditViewModal
        open={editingView !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingView(null);
          }
        }}
        view={editingView}
        editView={_editView}
      />
    </ViewsContext.Provider>
  );
};
