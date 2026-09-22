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
import { useSearchParams } from "react-router";
import { DeleteActionDialog } from "@next-pms/design-system/components";
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
import { useUser } from "@/providers/user";
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
  const currentUser = useUser(({ state }) => state.currentUser);

  const [isCreateViewModal, setIsCreateViewModal] = useState(false);
  const [type, settype] = useState("");
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  // Fields the caller wants saved with the view beyond the ones the provider
  // manages itself, such as a list's column layout.
  const [viewFields, setViewFields] = useState<Partial<View>>({});
  const [editingView, setEditingView] = useState<View | null>(null);
  const [deletingView, setDeletingView] = useState<View | null>(null);

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

  const currentFilters = Object.fromEntries(
    filterParamKeys?.map((key) => [key, searchParams.get(key)]) ?? [],
  );

  const applyView = useCallback(
    (
      view: View,
      options?: {
        replace?: boolean;
        reset?: boolean;
        params?: Record<string, string | null>;
      },
    ) => {
      appliedViewName.current = String(view.name);
      setSearchParams(
        (params) => {
          params.set("view", String(view.name));

          filterParamKeys?.forEach((key) => {
            const value = view.filters?.[key];
            if (value) {
              params.set(
                key,
                typeof value === "string" ? value : JSON.stringify(value),
              );
            } else if (value === null || options?.reset) {
              params.delete(key);
            }
          });

          Object.entries(options?.params ?? {}).forEach(([key, value]) => {
            if (value) {
              params.set(key, value);
            } else {
              params.delete(key);
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
    (args?: {
      type?: string;
      filters?: Record<string, unknown>;
      fields?: Partial<View>;
    }) => {
      if (args?.type) {
        settype(args.type);
      }
      setFilters(args?.filters ?? {});
      setViewFields(args?.fields ?? {});
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
      let _filters;

      if (filterParamKeys) {
        _filters = Object.fromEntries(
          filterParamKeys.map((key) => [key, filters[key] ?? null]),
        );
      } else {
        _filters = filters;
      }
      try {
        const { message } = await createViewCall({
          view: {
            ...viewFields,
            label: label,
            public: isPublic ? 1 : 0,
            icon: icon,
            dt: doctype,
            type: type,
            filters: _filters,
          },
        });
        await mutate();
        toast.success("View Created");
        if (Array.isArray(message) && message.length > 0) {
          applyView(message[0]);
        }
      } catch (error) {
        const message = parseFrappeErrorMsg(error as FrappeError);
        toast.error(message);
      }
    },
    [
      createViewCall,
      mutate,
      doctype,
      type,
      filters,
      toast,
      applyView,
      filterParamKeys,
      viewFields,
    ],
  );

  const duplicateView = useCallback(
    async (view: View) => {
      try {
        await createViewCall({
          view: {
            ...view,
            label: `${view.label} (Copy)`,
            public: 0,
            default: 0,
            dt: doctype,
          },
        });
        await mutate();
        toast.success("View Duplicated");
      } catch (error) {
        const message = parseFrappeErrorMsg(error as FrappeError);
        toast.error(message);
      }
    },
    [createViewCall, mutate, doctype, toast],
  );

  const editView = useCallback((view: View, fields?: Partial<View>) => {
    setEditingView(view);
    setViewFields(fields ?? {});
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
          ...viewFields,
          filters: { ...editingView.filters, ...currentFilters },
          label: label,
          icon: icon,
          public: isPublic ? 1 : 0,
          dt: doctype,
        },
      });
      await mutate();
    },
    [updateViewCall, mutate, doctype, editingView, currentFilters, viewFields],
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
    [updateViewCall, mutate, doctype, toast],
  );

  const deleteView = useCallback((view: View) => {
    setDeletingView(view);
  }, []);

  const _deleteView = useCallback(
    async (view: View) => {
      try {
        await deleteDoc("PMS View Setting", String(view.name));
        await mutate();
        toast.success("View Deleted");
      } catch (error) {
        const message = parseFrappeErrorMsg(error as FrappeError);
        toast.error(message);
      }
    },
    [toast, deleteDoc, mutate],
  );

  const canManageView = useCallback(
    (view: View) =>
      currentUser === "Administrator" ||
      (!!currentUser && view.owner === currentUser),
    [currentUser],
  );

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const isDirty = useMemo(() => {
    if (!activeView) {
      return false;
    }
    const differs = (key: string, saved: string) =>
      (searchParams.get(key) ?? "") !== saved;

    return (filterParamKeys ?? []).some((key) => {
      const saved = activeView.filters?.[key];
      return differs(
        key,
        saved == null
          ? ""
          : typeof saved === "string"
            ? saved
            : JSON.stringify(saved),
      );
    });
  }, [activeView, searchParams, filterParamKeys]);

  const value = useMemo(
    () => ({
      state: {
        doctype,
        views,
        defaultViews: defaultViews ?? [],
        savedViews,
        activeView,
        isLoading,
        canManageView,
        isDirty,
      },
      actions: {
        createView,
        applyView,
        duplicateView,
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
      canManageView,
      isDirty,
      createView,
      applyView,
      duplicateView,
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
      {deletingView ? (
        <DeleteActionDialog
          title="Delete view"
          description={`Are you sure you want to delete "${deletingView.label}"? This action cannot be undone.`}
          onClose={() => setDeletingView(null)}
          onConfirm={() => _deleteView(deletingView)}
        />
      ) : null}
    </ViewsContext.Provider>
  );
};
