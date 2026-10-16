import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { toast } from "frappe-ui";
import { ApiError, deferred, mockApi, type ApiRequest } from "@/test/api";
import { unmountAll, withSetup } from "@/test/withSetup";
import { provideTaskList, useTaskList } from "./useTaskList";

const LIST = "next_pms.timesheet.api.task.get_task_list";

/** A server holding `total` tasks named T-0, T-1, … */
function taskServer(total: number) {
  return ({ params }: ApiRequest) => {
    const start = Number(params.start);
    const length = Number(params.page_length);
    const end = Math.min(start + length, total);
    return {
      task: Array.from({ length: Math.max(end - start, 0) }, (_, i) => ({
        name: `T-${start + i}`,
      })),
      total_count: total,
      has_more: end < total,
    };
  };
}

const names = (rows: { name: string }[]) => rows.map((row) => row.name);

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe("useTaskList", () => {
  it("loads the first page with the URL's filters", async () => {
    const api = mockApi({ [LIST]: taskServer(5) });
    const advanced = JSON.stringify([
      { field: "subject", operator: "like", value: "login" },
      { field: "priority", operator: "=", value: "" },
    ]);
    const { result } = await withSetup(provideTaskList, {
      route: {
        path: "/tasks",
        query: {
          search: "api",
          project: "P-1",
          status: encodeURI('["Open"]'),
          advanced,
          sortField: "subject",
          sortOrder: "asc",
        },
      },
    });
    expect(result.isInitialLoad).toBe(true);
    await vi.waitFor(() => expect(result.rows).toHaveLength(5));
    expect(result.isInitialLoad).toBe(false);
    expect(result.hasMore).toBe(false);
    expect(api.requests[0].params).toEqual({
      search: "api",
      projects: '["P-1"]',
      status: '["Open"]',
      filters: '[["subject","like","%login%"]]',
      order_by: "subject asc",
      start: "0",
      page_length: "20",
    });
  });

  it("sorts by last update when the URL has no sort", async () => {
    const api = mockApi({ [LIST]: taskServer(0) });
    await withSetup(provideTaskList, { route: "/tasks" });
    await vi.waitFor(() => expect(api.requests).toHaveLength(1));
    expect(api.requests[0].params).toEqual({
      order_by: "modified desc",
      start: "0",
      page_length: "20",
    });
  });

  it("appends the next page and stops when there are no more", async () => {
    const api = mockApi({ [LIST]: taskServer(25) });
    const { result } = await withSetup(provideTaskList, { route: "/tasks" });
    await vi.waitFor(() => expect(result.rows).toHaveLength(20));
    expect(result.hasMore).toBe(true);

    result.loadMore();
    expect(result.isNextPageLoading).toBe(true);
    result.loadMore();
    await vi.waitFor(() => expect(result.rows).toHaveLength(25));
    expect(names(result.rows).slice(19, 21)).toEqual(["T-19", "T-20"]);
    expect(result.hasMore).toBe(false);
    expect(api.requests.map((r) => r.params.start)).toEqual(["0", "20"]);

    result.loadMore();
    await nextTick();
    expect(api.requests).toHaveLength(2);
  });

  it("refreshes every shown page in one request", async () => {
    const api = mockApi({ [LIST]: taskServer(45) });
    const { result } = await withSetup(provideTaskList, { route: "/tasks" });
    await vi.waitFor(() => expect(result.rows).toHaveLength(20));
    result.loadMore();
    await vi.waitFor(() => expect(result.rows).toHaveLength(40));

    result.refresh();
    expect(result.isLoading).toBe(true);
    expect(result.isFilterRequest).toBe(false);
    await vi.waitFor(() => expect(result.isLoading).toBe(false));
    expect(api.requests.at(-1)?.params).toMatchObject({
      start: "0",
      page_length: "40",
    });
    expect(result.rows).toHaveLength(40);
  });

  it("reloads when the filters change but not for other params", async () => {
    const api = mockApi({ [LIST]: taskServer(3) });
    const { result, router } = await withSetup(provideTaskList, {
      route: "/tasks",
    });
    await vi.waitFor(() => expect(result.rows).toHaveLength(3));

    await router.replace({ query: { columnOrder: "status" } });
    await nextTick();
    expect(api.requests).toHaveLength(1);

    await router.replace({ query: { search: "x" } });
    expect(result.isFilterRequest).toBe(true);
    await vi.waitFor(() => expect(result.isLoading).toBe(false));
    expect(api.requests).toHaveLength(2);
    expect(api.requests[1].params.search).toBe("x");
  });

  it("ignores a response that a newer request overtook", async () => {
    const first = deferred();
    let calls = 0;
    mockApi({
      [LIST]: (request) => {
        calls += 1;
        if (calls === 1) {
          return first.promise.then(() => ({
            task: [{ name: "stale" }],
            has_more: false,
          }));
        }
        return taskServer(1)(request);
      },
    });
    const { result, router } = await withSetup(provideTaskList, {
      route: "/tasks",
    });
    await router.replace({ query: { search: "x" } });
    await vi.waitFor(() => expect(names(result.rows)).toEqual(["T-0"]));

    first.resolve(null);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(names(result.rows)).toEqual(["T-0"]);
    expect(result.isLoading).toBe(false);
  });

  it("deletes a task, then refreshes the list", async () => {
    const api = mockApi({
      [LIST]: taskServer(2),
      "document/Task/T-1": () => null,
    });
    const success = vi.spyOn(toast, "success").mockImplementation(() => "");
    const { result } = await withSetup(provideTaskList, { route: "/tasks" });
    await vi.waitFor(() => expect(result.rows).toHaveLength(2));

    await result.deleteTask("T-1");
    expect(api.requestsTo("document/Task/T-1")[0].method).toBe("DELETE");
    expect(success).toHaveBeenCalledWith("Task deleted");
    await vi.waitFor(() => expect(api.requestsTo(LIST)).toHaveLength(2));
  });

  it("shows the server's message when a delete fails", async () => {
    mockApi({
      [LIST]: taskServer(1),
      "document/Task/T-0": () =>
        new ApiError("Task has timesheets", "LinkExistsError"),
    });
    const error = vi.spyOn(toast, "error").mockImplementation(() => "");
    const { result } = await withSetup(provideTaskList, { route: "/tasks" });
    await vi.waitFor(() => expect(result.rows).toHaveLength(1));

    await result.deleteTask("T-0");
    expect(error).toHaveBeenCalledWith("Task has timesheets");
  });

  it("shows an error toast when the list fails to load", async () => {
    mockApi({ [LIST]: () => new ApiError("Server down") });
    const error = vi.spyOn(toast, "error").mockImplementation(() => "");
    const { result } = await withSetup(provideTaskList, { route: "/tasks" });
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith("Server down"));
    expect(result.isLoading).toBe(false);
  });

  it("fails when no parent provides the list", async () => {
    await expect(withSetup(useTaskList)).rejects.toThrow(
      "useTaskList() needs provideTaskList() in a parent",
    );
  });
});
