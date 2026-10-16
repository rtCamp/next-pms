import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { dialog, toast } from "frappe-ui";
import { ApiError, mockApi, type ApiRequest } from "@/test/api";
import { unmountAll, withSetup } from "@/test/withSetup";
import type { ProjectView } from "./types";
import { provideProjectViews, useProjectViews } from "./useProjectViews";

const METHODS = "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting";
const GET_VIEW = `${METHODS}.get_view`;
const CREATE_VIEW = `${METHODS}.create_view`;
const UPDATE_VIEW = `${METHODS}.update_view`;

const USER = "ada@example.com";

function savedView(overrides: Partial<ProjectView> = {}): ProjectView {
  return {
    name: "5",
    label: "Open builds",
    icon: "🚀",
    owner: USER,
    default: 0,
    public: 0,
    dt: "Project",
    type: "List",
    columns: ["phase", "name"],
    rows: [],
    filters: {
      phase: "Build",
      status: "Open",
      rag: ["red"],
      sortField: "total_budget",
      sortOrder: "asc",
    },
    order_by: [],
    pinnedColumns: ["name"],
    ...overrides,
  };
}

beforeAll(() => {
  // The session reads the user from the cookie when it's first used.
  // eslint-disable-next-line no-restricted-properties
  document.cookie = `user_id=${encodeURIComponent(USER)}; path=/`;
});

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

async function setup(
  route: string,
  views: ProjectView[] = [savedView()],
  handlers: Record<string, (request: ApiRequest) => unknown> = {},
) {
  // The server numbers PMS View Settings.
  const served = views.map((view) => ({ ...view, name: Number(view.name) }));
  const api = mockApi({ [GET_VIEW]: () => served, ...handlers });
  const addServed = (view: ProjectView) =>
    served.push({ ...view, name: Number(view.name) });
  const mounted = await withSetup(provideProjectViews, { route });
  await vi.waitFor(() => expect(mounted.result.loaded).toBe(true));
  await vi.waitFor(() =>
    expect(mounted.router.currentRoute.value.query.view).toBeDefined(),
  );
  return { ...mounted, api, addServed };
}

describe("useProjectViews", () => {
  it("lists the built-in views, then the saved ones by string name", async () => {
    const { result, api } = await setup("/projects");
    expect(api.requests[0].params).toEqual({ dt: "Project" });
    expect(result.builtInViews.map((view) => view.name)).toEqual([
      "list",
      "kanban",
    ]);
    expect(result.savedViews.map((view) => view.name)).toEqual(["5"]);
  });

  it("opens the list view when the URL names none", async () => {
    const { result, router } = await setup("/projects?search=web");
    await vi.waitFor(() => expect(result.activeView?.name).toBe("list"));
    expect(router.currentRoute.value.query).toEqual({
      view: "list",
      search: "web",
    });
    expect(result.isKanban).toBe(false);
    expect(result.isSavedView).toBe(false);
    expect(result.isDirty).toBe(true);
  });

  it("opens the default saved view when there is one", async () => {
    const { result } = await setup("/projects", [savedView({ default: 1 })]);
    await vi.waitFor(() => expect(result.activeView?.name).toBe("5"));
  });

  it("applies a saved view's filters, sort and layout from the URL", async () => {
    const { result, router } = await setup("/projects?view=5&search=web");
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({
        view: "5",
        search: "web",
        phase: "Build",
        status: "Open",
        rag: '["red"]',
        sortField: "total_budget",
        sortOrder: "asc",
        columnOrder: "phase,name",
        pinned: "name",
      }),
    );
    expect(result.isSavedView).toBe(true);
    expect(result.currentLayout).toEqual({
      order: ["phase", "name"],
      pinned: ["name"],
    });
  });

  it("applies a view's saved order_by as the sort", async () => {
    const { router } = await setup("/projects?view=5", [
      savedView({ filters: {}, order_by: ["project_name"] }),
    ]);
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toMatchObject({
        sortField: "project_name",
        sortOrder: "desc",
      }),
    );
  });

  it("keeps the column layout a shared link carries", async () => {
    const { router } = await setup("/projects?view=5&columnOrder=customer");
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query.phase).toBe("Build"),
    );
    expect(router.currentRoute.value.query.columnOrder).toBe("customer");
    expect(router.currentRoute.value.query).not.toHaveProperty("pinned");
  });

  it("marks the view dirty when the URL changes, and reverts", async () => {
    const { result, router } = await setup("/projects?view=5");
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query.phase).toBe("Build"),
    );
    expect(result.isDirty).toBe(false);

    await router.replace({
      query: { ...router.currentRoute.value.query, search: "web" },
    });
    expect(result.isDirty).toBe(true);

    result.revertView();
    await vi.waitFor(() => expect(result.isDirty).toBe(false));
    expect(router.currentRoute.value.query).not.toHaveProperty("search");
  });

  it("switches to the kanban, pushing a history entry", async () => {
    const { result, router } = await setup("/projects?view=list");
    const push = vi.spyOn(router, "push");
    result.applyView(result.builtInViews[1]);
    await vi.waitFor(() => expect(result.isKanban).toBe(true));
    expect(push).toHaveBeenCalledOnce();
  });

  it("lets the owner and Administrator manage a view", async () => {
    const { result } = await setup("/projects");
    expect(result.canManageView(savedView())).toBe(true);
    expect(result.canManageView(savedView({ owner: "bo@example.com" }))).toBe(
      false,
    );
    expect(result.canManageView(result.builtInViews[0])).toBe(false);
  });

  it("creates a view of the current filters and layout, then opens it", async () => {
    const created = savedView({ name: "9", label: "Mine" });
    const { result, router, api, addServed } = await setup(
      "/projects?view=list&phase=Discovery&columnOrder=name&pinned=name",
      [savedView()],
      {
        [CREATE_VIEW]: () => {
          addServed(created);
          return [{ ...created, name: 9 }];
        },
      },
    );
    const success = vi.spyOn(toast, "success").mockImplementation(() => "");
    await vi.waitFor(() => expect(result.activeView?.name).toBe("list"));

    result.createView();
    expect(result.viewDialog).toMatchObject({
      mode: "create",
      type: "List",
      layout: { order: ["name"], pinned: ["name"] },
    });
    await result.saveViewDialog({ label: "Mine", icon: "🔥", isPublic: true });

    expect(api.requestsTo(CREATE_VIEW)[0].params).toEqual({
      view: {
        columns: ["name"],
        pinnedColumns: ["name"],
        label: "Mine",
        public: 1,
        icon: "🔥",
        dt: "Project",
        type: "List",
        filters: {
          search: null,
          rag: null,
          phase: "Discovery",
          status: null,
          advanced: null,
          currency: null,
          sortField: null,
          sortOrder: null,
        },
      },
    });
    expect(api.requestsTo(GET_VIEW)).toHaveLength(2);
    expect(success).toHaveBeenCalledWith("View Created");
    expect(result.viewDialog).toBeNull();
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query.view).toBe("9"),
    );
  });

  it("saves an edited view with the URL's filters and the given layout", async () => {
    const { result, router, api } = await setup(
      "/projects?view=5",
      [savedView()],
      { [UPDATE_VIEW]: ({ params }) => params.view },
    );
    vi.spyOn(toast, "success").mockImplementation(() => "");
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query.phase).toBe("Build"),
    );
    await router.replace({
      query: { ...router.currentRoute.value.query, phase: "Discovery" },
    });

    result.editView(result.savedViews[0], { order: ["customer"], pinned: [] });
    await result.saveViewDialog({
      label: "Renamed",
      icon: "📌",
      isPublic: false,
    });

    const { view } = api.requestsTo(UPDATE_VIEW)[0].params as {
      view: ProjectView;
    };
    expect(view).toMatchObject({
      name: "5",
      label: "Renamed",
      icon: "📌",
      public: 0,
      columns: ["customer"],
      pinnedColumns: [],
      filters: { phase: "Discovery", status: "Open", search: null },
    });
    expect(result.viewDialog).toBeNull();
  });

  it("keeps the dialog open and rethrows when saving fails", async () => {
    const { result } = await setup("/projects?view=list", [], {
      [CREATE_VIEW]: () => new ApiError("Label taken"),
    });
    result.createView();
    await expect(
      result.saveViewDialog({ label: "X", icon: "🔥", isPublic: false }),
    ).rejects.toThrow("Label taken");
    expect(result.viewDialog).not.toBeNull();
  });

  it("duplicates a view as a private copy", async () => {
    const { result, api } = await setup("/projects", [savedView()], {
      [CREATE_VIEW]: () => [],
    });
    const success = vi.spyOn(toast, "success").mockImplementation(() => "");
    await result.duplicateView(savedView({ public: 1, default: 1 }));
    expect(api.requestsTo(CREATE_VIEW)[0].params).toMatchObject({
      view: { label: "Open builds (Copy)", public: 0, default: 0 },
    });
    expect(success).toHaveBeenCalledWith("View Duplicated");
  });

  it("shows an error toast when duplicating or updating fails", async () => {
    const { result } = await setup("/projects", [savedView()], {
      [CREATE_VIEW]: () => new ApiError("Label taken"),
      [UPDATE_VIEW]: () => new ApiError("Not permitted"),
    });
    const error = vi.spyOn(toast, "error").mockImplementation(() => "");
    const success = vi.spyOn(toast, "success").mockImplementation(() => "");
    await result.duplicateView(savedView());
    await result.updateView(savedView());
    expect(error.mock.calls).toEqual([["Label taken"], ["Not permitted"]]);
    expect(success).not.toHaveBeenCalled();
  });

  it("updates a view", async () => {
    const { result, api } = await setup("/projects", [savedView()], {
      [UPDATE_VIEW]: ({ params }) => params.view,
    });
    const success = vi.spyOn(toast, "success").mockImplementation(() => "");
    await result.updateView(savedView({ label: "Renamed" }));
    expect(api.requestsTo(UPDATE_VIEW)[0].params).toMatchObject({
      view: { label: "Renamed", dt: "Project" },
    });
    expect(success).toHaveBeenCalledWith("View Updated");
  });

  it("deletes a view after confirmation", async () => {
    const { result, api } = await setup("/projects", [savedView()], {
      "document/PMS View Setting/5": () => null,
    });
    const danger = vi
      .spyOn(dialog, "danger")
      .mockImplementation(() => ({}) as never);
    const success = vi.spyOn(toast, "success").mockImplementation(() => "");

    result.deleteView(result.savedViews[0]);
    const [{ title, onConfirm }] = danger.mock.calls[0] as [
      { title: string; onConfirm: () => Promise<void> },
    ];
    expect(title).toBe("Delete view");
    expect(api.requestsTo("document/PMS View Setting/5")).toHaveLength(0);

    await onConfirm();
    expect(api.requestsTo("document/PMS View Setting/5")[0].method).toBe(
      "DELETE",
    );
    expect(success).toHaveBeenCalledWith("View Deleted");
  });

  it("fails when no parent provides the views", async () => {
    await expect(withSetup(useProjectViews)).rejects.toThrow(
      "useProjectViews() needs provideProjectViews() in a parent",
    );
  });
});
