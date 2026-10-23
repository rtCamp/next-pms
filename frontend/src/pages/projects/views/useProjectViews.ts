import {
  computed,
  inject,
  provide,
  reactive,
  ref,
  watch,
  type InjectionKey,
} from "vue";
import { useRoute } from "vue-router";
import { dialog, toast, useCall, useDoctype } from "frappe-ui";
import { useQueryPatch } from "@/composables/useQueryPatch";
import { useSession } from "@/session";
import { errorMessage } from "@/utils/errors";
import { queryString } from "@/utils/query";
import {
  COLUMN_ORDER_PARAM,
  FILTER_PARAM_KEYS,
  PINNED_COLUMNS_PARAM,
} from "../constants";
import {
  DEFAULT_COLUMN_ORDER,
  layoutParams,
  parseKeys,
  useProjectColumns,
  type ColumnLayout,
} from "../useProjectColumns";
import { BUILT_IN_VIEWS } from "./constants";
import type { ProjectView } from "./types";

const VIEW_METHODS =
  "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting";

/** Fields the create and edit dialogs ask for. */
export interface ViewDetails {
  label: string;
  icon: string;
  isPublic: boolean;
}

/** What a view's dialog is open for, and the values it saves along. */
type ViewDialogState =
  | {
      mode: "create";
      type: ProjectView["type"];
      filters: Record<string, string>;
      layout: ColumnLayout;
    }
  | { mode: "edit"; view: ProjectView; layout?: ColumnLayout };

/** The column layout a view saves, as the server stores it. */
function viewLayoutFields(layout: ColumnLayout) {
  return { columns: layout.order, pinnedColumns: layout.pinned };
}

/** A view's saved column layout; one saved without a layout gets the default. */
function savedLayout(view: ProjectView): ColumnLayout {
  const order = parseKeys(view.columns);
  return {
    order: order.length > 0 ? order : DEFAULT_COLUMN_ORDER,
    pinned: parseKeys(view.pinnedColumns),
  };
}

function savedFilterValue(view: ProjectView, key: string): string {
  const value = view.filters?.[key];
  if (value == null) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function createProjectViews() {
  const route = useRoute();
  const patchQuery = useQueryPatch();
  const session = useSession();
  const columns = useProjectColumns();

  const savedViewsCall = useCall<ProjectView[], { dt: string }>({
    url: `/api/v2/method/${VIEW_METHODS}.get_view`,
    params: { dt: "Project" },
  });
  const createViewCall = useCall<ProjectView[], { view: Partial<ProjectView> }>(
    {
      url: `/api/v2/method/${VIEW_METHODS}.create_view`,
      method: "POST",
      immediate: false,
    },
  );
  const updateViewCall = useCall<ProjectView, { view: Partial<ProjectView> }>({
    url: `/api/v2/method/${VIEW_METHODS}.update_view`,
    method: "POST",
    immediate: false,
  });
  const viewSettings = useDoctype("PMS View Setting");

  // PMS View Setting names are autoincrement numbers; the `view` param is a string.
  const savedViews = computed(() =>
    (savedViewsCall.data ?? []).map((view) => ({
      ...view,
      name: String(view.name),
    })),
  );
  const views = computed(() => [...BUILT_IN_VIEWS, ...savedViews.value]);
  const loaded = computed(
    () => savedViewsCall.data !== null || Boolean(savedViewsCall.error),
  );
  const activeView = computed(() =>
    views.value.find((view) => view.name === queryString(route.query.view)),
  );

  /** The view whose filters and layout were last written to the URL. */
  let appliedView: string | undefined;

  /**
   * Selects a view: writes its filters, sort and column layout to the URL. Filters the
   * view has no value for are kept, unless `reset`; `layout: false` keeps the URL's
   * column layout. On the page's first apply (`initial`), a view without a currency
   * keeps the default one the page started with.
   */
  function applyView(
    view: ProjectView,
    options: {
      replace?: boolean;
      reset?: boolean;
      layout?: boolean;
      initial?: boolean;
    } = {},
  ) {
    appliedView = view.name;
    const patch: Record<string, string | null> = { view: view.name };
    for (const key of FILTER_PARAM_KEYS) {
      const value = view.filters?.[key];
      if (value) patch[key] = savedFilterValue(view, key);
      else if (key === "currency" && options.initial) continue;
      else if (value === null || options.reset) patch[key] = null;
    }
    if (options.layout !== false) {
      Object.assign(patch, layoutParams(savedLayout(view)));
    }
    const [sort] = view.order_by ?? [];
    if (typeof sort === "string" && sort) {
      const [field, order] = sort.split(" ");
      patch.sortField = field ?? null;
      patch.sortOrder = order ?? "desc";
    }
    patchQuery(patch, { push: !options.replace });
  }

  // Opening the page applies the `view` param's view, or the default view when it
  // names none. A link that carries its own column layout keeps it.
  watch(
    [loaded, activeView],
    ([isLoaded, view]) => {
      if (!isLoaded) return;
      if (!view) {
        const fallback =
          views.value.find((candidate) => candidate.default === 1) ??
          views.value[0];
        if (fallback) applyView(fallback, { replace: true, initial: true });
        return;
      }
      if (appliedView === view.name) return;
      const hasLayout =
        COLUMN_ORDER_PARAM in route.query ||
        PINNED_COLUMNS_PARAM in route.query;
      applyView(view, {
        replace: true,
        layout: appliedView !== undefined || !hasLayout,
        initial: appliedView === undefined,
      });
    },
    { immediate: true },
  );

  const currentFilters = computed(() =>
    Object.fromEntries(
      FILTER_PARAM_KEYS.map((key) => [
        key,
        queryString(route.query[key]) || null,
      ]),
    ),
  );

  const currentLayout = computed<ColumnLayout>(() => ({
    order: columns.order.value,
    pinned: columns.pinned.value,
  }));

  /** The URL's filters, sort or column layout differ from the active view's. */
  const isDirty = computed(() => {
    const view = activeView.value;
    if (!view) return false;
    const filtersDiffer = FILTER_PARAM_KEYS.some(
      (key) => queryString(route.query[key]) !== savedFilterValue(view, key),
    );
    const saved = savedLayout(view);
    const layoutDiffers =
      currentLayout.value.order.join(",") !== saved.order.join(",") ||
      currentLayout.value.pinned.join(",") !== saved.pinned.join(",");
    return filtersDiffer || layoutDiffers;
  });

  const isSavedView = computed(() =>
    savedViews.value.some((view) => view.name === activeView.value?.name),
  );

  function canManageView(view: ProjectView) {
    return (
      session.userId === "Administrator" ||
      (Boolean(session.userId) && view.owner === session.userId)
    );
  }

  const viewDialog = ref<ViewDialogState | null>(null);

  /** Opens the create dialog for a view of the current filters and layout. */
  function createView() {
    const filters = Object.fromEntries(
      Object.entries(route.query)
        .filter(([key]) => key !== "view")
        .map(([key, value]) => [key, queryString(value)]),
    );
    viewDialog.value = {
      mode: "create",
      type: activeView.value?.type ?? "List",
      filters,
      layout: currentLayout.value,
    };
  }

  /** Opens the edit dialog; `layout` is saved along, as "Save changes" does. */
  function editView(view: ProjectView, layout?: ColumnLayout) {
    viewDialog.value = { mode: "edit", view, layout };
  }

  async function saveViewDialog(details: ViewDetails) {
    const state = viewDialog.value;
    if (!state) return;
    if (state.mode === "create") {
      const created = await createViewCall.submit({
        view: {
          ...viewLayoutFields(state.layout),
          label: details.label,
          public: details.isPublic ? 1 : 0,
          icon: details.icon,
          dt: "Project",
          type: state.type,
          filters: Object.fromEntries(
            FILTER_PARAM_KEYS.map((key) => [key, state.filters[key] || null]),
          ),
        },
      });
      if (createViewCall.error) throw createViewCall.error;
      await savedViewsCall.fetch();
      toast.success("View Created");
      const [newest] = created ?? [];
      if (newest) applyView({ ...newest, name: String(newest.name) });
    } else {
      // The URL holds the active view's filters, so they only belong to that view.
      const isActive = state.view.name === activeView.value?.name;
      await updateViewCall.submit({
        view: {
          ...state.view,
          ...(state.layout ? viewLayoutFields(state.layout) : {}),
          filters: isActive
            ? { ...state.view.filters, ...currentFilters.value }
            : state.view.filters,
          label: details.label,
          icon: details.icon,
          public: details.isPublic ? 1 : 0,
          dt: "Project",
        },
      });
      if (updateViewCall.error) throw updateViewCall.error;
      await savedViewsCall.fetch();
      toast.success("View updated successfully");
    }
    viewDialog.value = null;
  }

  async function duplicateView(view: ProjectView) {
    // submit() rejects when the request fails; the error is read from the call below.
    await createViewCall
      .submit({
        view: {
          ...view,
          label: `${view.label} (Copy)`,
          public: 0,
          default: 0,
          dt: "Project",
        },
      })
      .catch(() => undefined);
    if (createViewCall.error) {
      toast.error(errorMessage(createViewCall.error));
      return;
    }
    await savedViewsCall.fetch();
    toast.success("View Duplicated");
  }

  async function updateView(view: ProjectView) {
    await updateViewCall
      .submit({ view: { ...view, dt: "Project" } })
      .catch(() => undefined);
    if (updateViewCall.error) {
      toast.error(errorMessage(updateViewCall.error));
      return;
    }
    await savedViewsCall.fetch();
    toast.success("View Updated");
  }

  function deleteView(view: ProjectView) {
    dialog.danger({
      title: "Delete view",
      message: `Are you sure you want to delete "${view.label}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await viewSettings.delete.submit({ name: view.name });
          await savedViewsCall.fetch();
          toast.success("View Deleted");
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });
  }

  /** Drops the URL's changes: back to the active view's filters and layout. */
  function revertView() {
    if (activeView.value) applyView(activeView.value, { reset: true });
  }

  return reactive({
    builtInViews: BUILT_IN_VIEWS,
    savedViews,
    activeView,
    loaded,
    isKanban: computed(() => activeView.value?.type === "Custom"),
    isDirty,
    isSavedView,
    currentLayout,
    viewDialog,
    applyView,
    canManageView,
    createView,
    editView,
    saveViewDialog,
    duplicateView,
    updateView,
    deleteView,
    revertView,
  });
}

export type ProjectViews = ReturnType<typeof createProjectViews>;

const projectViewsKey: InjectionKey<ProjectViews> = Symbol("projectViews");

/** Creates the page's views and shares them with its parts. */
export function provideProjectViews(): ProjectViews {
  const views = createProjectViews();
  provide(projectViewsKey, views);
  return views;
}

/** The views provided by the projects page. */
export function useProjectViews(): ProjectViews {
  const views = inject(projectViewsKey);
  if (!views) {
    throw new Error(
      "useProjectViews() needs provideProjectViews() in a parent",
    );
  }
  return views;
}
