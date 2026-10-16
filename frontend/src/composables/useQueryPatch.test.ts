import { afterEach, describe, expect, it, vi } from "vitest";
import { unmountAll, withSetup } from "@/test/withSetup";
import { useQueryPatch } from "./useQueryPatch";

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

async function setup(route = "/tasks?search=api&page=2#top") {
  const { result: patchQuery, router } = await withSetup(useQueryPatch, {
    route,
  });
  const replace = vi.spyOn(router, "replace");
  const push = vi.spyOn(router, "push");
  return { patchQuery, router, replace, push };
}

describe("useQueryPatch", () => {
  it("sets and removes params, keeping the rest and the hash", async () => {
    const { patchQuery, router, replace, push } = await setup();
    patchQuery({ status: "Open", search: "", page: null, missing: undefined });
    await vi.waitFor(() => expect(replace).toHaveBeenCalledOnce());
    await replace.mock.results[0].value;
    expect(router.currentRoute.value.fullPath).toBe("/tasks?status=Open#top");
    expect(push).not.toHaveBeenCalled();
  });

  it("merges patches made in the same tick into one navigation", async () => {
    const { patchQuery, router, replace } = await setup();
    patchQuery({ search: "web" });
    patchQuery({ status: "Open" });
    patchQuery({ search: "app" });
    await vi.waitFor(() => expect(replace).toHaveBeenCalledOnce());
    await replace.mock.results[0].value;
    expect(router.currentRoute.value.query).toEqual({
      search: "app",
      page: "2",
      status: "Open",
    });
  });

  it("pushes when any merged patch asks to", async () => {
    const { patchQuery, router, replace, push } = await setup();
    patchQuery({ search: "web" });
    patchQuery({ view: "kanban" }, { push: true });
    await vi.waitFor(() => expect(push).toHaveBeenCalledOnce());
    await push.mock.results[0].value;
    expect(replace).not.toHaveBeenCalled();
    expect(router.currentRoute.value.query).toMatchObject({
      search: "web",
      view: "kanban",
    });
  });

  it("starts each navigation from the query the previous one left", async () => {
    const { patchQuery, router } = await setup("/tasks");
    patchQuery({ a: "1" });
    await Promise.resolve();
    patchQuery({ b: "2" });
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({ a: "1", b: "2" }),
    );
  });
});
