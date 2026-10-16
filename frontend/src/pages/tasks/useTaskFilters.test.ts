import { afterEach, describe, expect, it, vi } from "vitest";
import type { FilterCondition } from "@/components/Filter";
import { unmountAll, withSetup } from "@/test/withSetup";
import { useTaskFilters } from "./useTaskFilters";

afterEach(unmountAll);

const ADVANCED = [
  { field: "priority", operator: "=", value: "High" },
] as FilterCondition[];

describe("useTaskFilters", () => {
  it("starts empty, sorted by last update", async () => {
    const { result } = await withSetup(useTaskFilters, { route: "/tasks" });
    expect(result.filters.value).toEqual({
      search: "",
      project: "",
      projectLabel: "",
      status: [],
      advanced: [],
    });
    expect(result.sort.value).toEqual({ field: "modified", order: "desc" });
  });

  it("reads the React page's params", async () => {
    const status = encodeURI(JSON.stringify(["Open", "Pending Review"]));
    const { result } = await withSetup(useTaskFilters, {
      route: {
        path: "/tasks",
        query: {
          search: "login",
          project: "P-1",
          projectLabel: "Website",
          status,
          advanced: JSON.stringify(ADVANCED),
          sortField: "subject",
          sortOrder: "asc",
        },
      },
    });
    expect(result.filters.value).toEqual({
      search: "login",
      project: "P-1",
      projectLabel: "Website",
      status: ["Open", "Pending Review"],
      advanced: ADVANCED,
    });
    expect(result.sort.value).toEqual({ field: "subject", order: "asc" });
  });

  it("writes each filter to the URL", async () => {
    const { result, router } = await withSetup(useTaskFilters, {
      route: "/tasks",
    });
    result.setSearch("api");
    result.setProject("P-1", "Website");
    result.setStatus(["Open", "Pending Review"]);
    result.setAdvanced(ADVANCED);
    result.setSort({ field: "priority", order: "asc" });
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({
        search: "api",
        project: "P-1",
        projectLabel: "Website",
        status: encodeURI('["Open","Pending Review"]'),
        advanced: JSON.stringify(ADVANCED),
        sortField: "priority",
        sortOrder: "asc",
      }),
    );
  });

  it("clears the project label with the project", async () => {
    const { result, router } = await withSetup(useTaskFilters, {
      route: "/tasks?project=P-1&projectLabel=Website",
    });
    result.setProject("", "ignored");
    await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({}));
  });

  it("drops empty lists and the sort", async () => {
    const { result, router } = await withSetup(useTaskFilters, {
      route: "/tasks?status=x&advanced=y&sortField=subject&sortOrder=asc",
    });
    result.setStatus([]);
    result.setAdvanced([]);
    result.setSort(null);
    await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({}));
  });

  it("resets the filters but keeps the sort and other params", async () => {
    const { result, router } = await withSetup(useTaskFilters, {
      route:
        "/tasks?search=a&project=P&projectLabel=L&status=s&advanced=v&sortField=subject&columnOrder=status",
    });
    result.resetFilters();
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({
        sortField: "subject",
        columnOrder: "status",
      }),
    );
  });
});
