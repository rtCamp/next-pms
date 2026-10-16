import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "frappe-ui";
import { ApiError, mockApi } from "@/test/api";
import { fakeSocket, unmountAll, withSetup } from "@/test/withSetup";
import { PROJECTS_VIEW_METHOD } from "../constants";
import { useProjectKanban } from "./useProjectKanban";

const BOARD = {
  data: { Build: [{ name: "P-1" }], Discovery: [] },
  total_count: 1,
};

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

async function setup(route = "/projects?view=kanban") {
  const api = mockApi({
    [PROJECTS_VIEW_METHOD]: () => BOARD,
    "document/Project/P-1": () => ({ name: "P-1" }),
  });
  const socket = fakeSocket();
  const mounted = await withSetup(useProjectKanban, {
    route,
    provide: [socket.provide],
  });
  await vi.waitFor(() => expect(mounted.result.loaded).toBe(true));
  return { ...mounted, api, socket };
}

describe("useProjectKanban", () => {
  it("loads every project grouped by phase, without sort or currency", async () => {
    const { result, api } = await setup(
      "/projects?view=kanban&search=web&status=Open&sortField=total_budget&currency=USD",
    );
    expect(result.data).toEqual(BOARD.data);
    expect(result.loading).toBe(false);
    expect(api.requests[0].params).toEqual({
      view: "kanban",
      search: "web",
      filters: '[["status","=","Open"]]',
      limit: "10000",
    });
  });

  it("reloads when the filters change", async () => {
    const { api, router } = await setup();
    await router.replace({ query: { view: "kanban", phase: "Build" } });
    await vi.waitFor(() => expect(api.requests).toHaveLength(2));
  });

  it("saves a project's new phase and reloads", async () => {
    const { result, api } = await setup();
    await result.updatePhase("P-1", "Discovery");
    const [save] = api.requestsTo("document/Project/P-1");
    expect(save.method).toBe("PUT");
    expect(save.params).toMatchObject({ custom_project_phase: "Discovery" });
    await vi.waitFor(() =>
      expect(api.requestsTo(PROJECTS_VIEW_METHOD)).toHaveLength(2),
    );
  });

  it("rejects when the phase can't be saved", async () => {
    mockApi({
      [PROJECTS_VIEW_METHOD]: () => BOARD,
      "document/Project/P-1": () => new ApiError("Not permitted"),
    });
    const { result } = await withSetup(useProjectKanban, {
      route: "/projects",
      provide: [fakeSocket().provide],
    });
    await expect(result.updatePhase("P-1", "Build")).rejects.toThrow(
      "Not permitted",
    );
  });

  it("reloads on realtime updates unless a card is being dragged", async () => {
    const { result, api, socket } = await setup();
    result.dragging = true;
    socket.receive("list_update", { doctype: "Project" });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(api.requests).toHaveLength(1);

    result.dragging = false;
    socket.receive("list_update", { doctype: "Project" });
    await vi.waitFor(() => expect(api.requests).toHaveLength(2));
  });

  it("shows an error toast when the board fails to load", async () => {
    mockApi({ [PROJECTS_VIEW_METHOD]: () => new ApiError("Server down") });
    const error = vi.spyOn(toast, "error").mockImplementation(() => "");
    await withSetup(useProjectKanban, {
      route: "/projects",
      provide: [fakeSocket().provide],
    });
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith("Server down"));
  });
});
