import { afterEach, describe, expect, it, vi } from "vitest";
import type { FilterCondition } from "@/components/Filter";
import { unmountAll, withSetup } from "@/test/withSetup";
import { defaultCurrency, useProjectFilters } from "./useProjectFilters";

const originalBoot = window.boot;

afterEach(() => {
  unmountAll();
  window.boot = originalBoot;
});

const ADVANCED = [
  { field: "customer", operator: "=", value: "Acme" },
] as FilterCondition[];

describe("defaultCurrency", () => {
  it("reads the site's currency, or INR", () => {
    window.boot = { sitename: "s", sysdefaults: { currency: "USD" } };
    expect(defaultCurrency()).toBe("USD");
    window.boot = { sitename: "s" };
    expect(defaultCurrency()).toBe("INR");
  });
});

describe("useProjectFilters", () => {
  it("starts empty, sorted by last update", async () => {
    const { result } = await withSetup(useProjectFilters, {
      route: "/projects",
    });
    expect(result.filters.value).toEqual({
      search: "",
      ragStatus: [],
      phase: "",
      status: "",
      advanced: [],
      currency: "",
    });
    expect(result.sort.value).toEqual({ field: "modified", order: "desc" });
  });

  it("reads the React page's params", async () => {
    const { result } = await withSetup(useProjectFilters, {
      route: {
        path: "/projects",
        query: {
          search: "web",
          rag: encodeURI('["red","amber"]'),
          phase: "Build",
          status: "Open",
          advanced: JSON.stringify(ADVANCED),
          currency: "USD",
          sortField: "total_budget",
          sortOrder: "asc",
        },
      },
    });
    expect(result.filters.value).toEqual({
      search: "web",
      ragStatus: ["red", "amber"],
      phase: "Build",
      status: "Open",
      advanced: ADVANCED,
      currency: "USD",
    });
    expect(result.sort.value).toEqual({ field: "total_budget", order: "asc" });
  });

  it("writes each filter to the URL", async () => {
    const { result, router } = await withSetup(useProjectFilters, {
      route: "/projects",
    });
    result.setSearch("web");
    result.setRagStatus(["green"]);
    result.setPhase("Build");
    result.setStatus("Completed");
    result.setAdvanced(ADVANCED);
    result.setCurrency("USD");
    result.setSort({ field: "project_name", order: "asc" });
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({
        search: "web",
        rag: encodeURI('["green"]'),
        phase: "Build",
        status: "Completed",
        advanced: JSON.stringify(ADVANCED),
        currency: "USD",
        sortField: "project_name",
        sortOrder: "asc",
      }),
    );
  });

  it("drops a sort on an amount when the currency is cleared", async () => {
    const { result, router } = await withSetup(useProjectFilters, {
      route: "/projects?currency=USD&sortField=total_budget&sortOrder=asc",
    });
    result.setCurrency("");
    await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({}));
  });

  it("keeps other sorts when the currency is cleared", async () => {
    const { result, router } = await withSetup(useProjectFilters, {
      route: "/projects?currency=USD&sortField=project_name&sortOrder=asc",
    });
    result.setCurrency("");
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({
        sortField: "project_name",
        sortOrder: "asc",
      }),
    );
  });

  it("resets the filters and sort, keeping the view and layout", async () => {
    const { result, router } = await withSetup(useProjectFilters, {
      route:
        "/projects?search=a&rag=r&phase=p&status=s&advanced=v&currency=USD&sortField=f&sortOrder=asc&view=list&columnOrder=name",
    });
    result.resetFilters();
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({
        view: "list",
        columnOrder: "name",
      }),
    );
  });
});
