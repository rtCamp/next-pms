import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "frappe-ui";
import { ApiError, mockApi, type ApiRequest } from "@/test/api";
import { fakeSocket, unmountAll, withSetup } from "@/test/withSetup";
import { PROJECTS_VIEW_METHOD } from "./constants";
import { provideProjectList, useProjectList } from "./useProjectList";

function projectServer(total: number) {
  return ({ params }: ApiRequest) => {
    const start = Number(params.start);
    const end = Math.min(start + Number(params.limit), total);
    return {
      data: Array.from({ length: Math.max(end - start, 0) }, (_, i) => ({
        name: `P-${start + i}`,
      })),
      total_count: total,
      has_more: end < total,
    };
  };
}

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

async function setup(route: string, total = 3) {
  const api = mockApi({ [PROJECTS_VIEW_METHOD]: projectServer(total) });
  const socket = fakeSocket();
  const mounted = await withSetup(provideProjectList, {
    route,
    provide: [socket.provide],
  });
  return { ...mounted, api, socket };
}

describe("useProjectList", () => {
  it("loads the list view with the URL's filters", async () => {
    const rag = encodeURI('["red"]');
    const advanced = encodeURIComponent(
      JSON.stringify([{ field: "customer", operator: "=", value: "Acme" }]),
    );
    const { result, api } = await setup(
      `/projects?search=web&rag=${rag}&phase=Build&status=Open&advanced=${advanced}&currency=USD&sortField=total_budget&sortOrder=asc`,
    );
    await vi.waitFor(() => expect(result.rows).toHaveLength(3));
    expect(api.requests[0].params).toEqual({
      view: "list",
      search: "web",
      filters: JSON.stringify([
        ["custom_project_rag_status", "in", "red"],
        ["custom_project_phase", "=", "Build"],
        ["status", "=", "Open"],
        ["customer", "=", "Acme"],
      ]),
      order_by: "total_budget asc",
      currency: "USD",
      start: "0",
      limit: "20",
    });
  });

  it("pages and refreshes", async () => {
    const { result, api } = await setup("/projects", 30);
    expect(result.isInitialLoad).toBe(true);
    await vi.waitFor(() => expect(result.rows).toHaveLength(20));
    expect(api.requests[0].params).toEqual({
      view: "list",
      order_by: "modified desc",
      start: "0",
      limit: "20",
    });

    result.loadMore();
    expect(result.isNextPageLoading).toBe(true);
    await vi.waitFor(() => expect(result.rows).toHaveLength(30));
    expect(result.hasMore).toBe(false);

    result.refresh();
    await vi.waitFor(() => expect(result.isLoading).toBe(false));
    expect(api.requests.at(-1)?.params).toMatchObject({
      start: "0",
      limit: "30",
    });
  });

  it("refreshes on a realtime Project update", async () => {
    const { result, api, socket } = await setup("/projects");
    await vi.waitFor(() => expect(result.rows).toHaveLength(3));
    expect(socket.emitted).toContainEqual(["doctype_subscribe", "Project"]);

    socket.receive("list_update", { doctype: "Project" });
    await vi.waitFor(() => expect(api.requests).toHaveLength(2));
  });

  it("shows a filter request while the old rows stay", async () => {
    const { result, router } = await setup("/projects");
    await vi.waitFor(() => expect(result.rows).toHaveLength(3));
    await router.replace({ query: { phase: "Build" } });
    expect(result.isFilterRequest).toBe(true);
    expect(result.rows).toHaveLength(3);
    await vi.waitFor(() => expect(result.isLoading).toBe(false));
  });

  it("shows an error toast when the list fails to load", async () => {
    mockApi({ [PROJECTS_VIEW_METHOD]: () => new ApiError("Server down") });
    const error = vi.spyOn(toast, "error").mockImplementation(() => "");
    const { result } = await withSetup(provideProjectList, {
      route: "/projects",
      provide: [fakeSocket().provide],
    });
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith("Server down"));
    expect(result.isLoading).toBe(false);
  });

  it("fails when no parent provides the list", async () => {
    await expect(withSetup(useProjectList)).rejects.toThrow(
      "useProjectList() needs provideProjectList() in a parent",
    );
  });
});
