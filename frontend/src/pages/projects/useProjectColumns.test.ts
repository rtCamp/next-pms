import { afterEach, describe, expect, it, vi } from "vitest";
import { unmountAll, withSetup } from "@/test/withSetup";
import {
  DEFAULT_COLUMN_ORDER,
  isDefaultOrder,
  layoutParams,
  parseKeys,
  useProjectColumns,
} from "./useProjectColumns";

afterEach(unmountAll);

const keys = (columns: { key: string }[]) =>
  columns.map((column) => column.key);

describe("parseKeys", () => {
  it("reads a list or a comma-separated string", () => {
    expect(parseKeys(["phase", "bogus", "name"])).toEqual(["phase", "name"]);
    expect(parseKeys("name,phase,name")).toEqual(["name", "phase"]);
    expect(parseKeys(undefined)).toEqual([]);
  });
});

describe("layoutParams", () => {
  it("leaves out a default order and writes the pins", () => {
    expect(layoutParams({ order: DEFAULT_COLUMN_ORDER, pinned: [] })).toEqual({
      columnOrder: "",
      pinned: "",
    });
    expect(
      layoutParams({ order: ["phase", "name"], pinned: ["name"] }),
    ).toEqual({ columnOrder: "phase,name", pinned: "name" });
    expect(layoutParams({})).toEqual({});
  });
});

describe("useProjectColumns", () => {
  it("shows the columns that aren't hidden by default", async () => {
    const { result } = await withSetup(useProjectColumns, {
      route: "/projects",
    });
    expect(keys(result.columns.value)).toEqual(DEFAULT_COLUMN_ORDER);
    expect(DEFAULT_COLUMN_ORDER).not.toContain("project_type");
    expect(isDefaultOrder(DEFAULT_COLUMN_ORDER)).toBe(true);
    expect(result.isDefault.value).toBe(true);
  });

  it("puts pinned columns first, in the order they were pinned", async () => {
    const { result } = await withSetup(useProjectColumns, {
      route: "/projects?columnOrder=name,phase,customer&pinned=customer,name",
    });
    expect(keys(result.columns.value)).toEqual(["customer", "name", "phase"]);
    expect(result.selectedColumns.value).toEqual([
      { value: "customer", label: "Client name", pinned: true },
      { value: "name", label: "Project name", pinned: true },
      { value: "phase", label: "Phase", pinned: false },
    ]);
    expect(result.isDefault.value).toBe(false);
  });

  it("isn't the default with pins on the default order", async () => {
    const { result } = await withSetup(useProjectColumns, {
      route: "/projects?pinned=phase",
    });
    expect(result.isDefault.value).toBe(false);
  });

  it("writes the selector's columns and pins", async () => {
    const { result, router } = await withSetup(useProjectColumns, {
      route: "/projects",
    });
    result.selectedColumns.value = [
      { value: "phase", label: "Phase", pinned: true },
      { value: "name", label: "Project name" },
    ];
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({
        columnOrder: "phase,name",
        pinned: "phase",
      }),
    );
  });

  it("pins up to three columns and unpins", async () => {
    const { result, router } = await withSetup(useProjectColumns, {
      route: "/projects?pinned=name,phase,customer",
    });
    result.togglePinned("total_budget");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(router.currentRoute.value.query.pinned).toBe("name,phase,customer");

    result.togglePinned("phase");
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query.pinned).toBe("name,customer"),
    );
    result.togglePinned("end_date");
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query.pinned).toBe(
        "name,customer,end_date",
      ),
    );
  });

  it("applies a header drag to the unpinned places", async () => {
    const { result, router } = await withSetup(useProjectColumns, {
      route: "/projects?columnOrder=name,phase,customer,end_date&pinned=phase",
    });
    result.reorder({
      pinned: ["phase"],
      scrolling: ["end_date", "name", "customer"],
    });
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({
        columnOrder: "end_date,phase,name,customer",
        pinned: "phase",
      }),
    );
  });

  it("reorders the pins", async () => {
    const { result, router } = await withSetup(useProjectColumns, {
      route: "/projects?columnOrder=name,phase&pinned=name,phase",
    });
    result.reorder({ pinned: ["phase", "name"], scrolling: [] });
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({
        columnOrder: "name,phase",
        pinned: "phase,name",
      }),
    );
  });

  it("resets to the default layout", async () => {
    const { result, router } = await withSetup(useProjectColumns, {
      route: "/projects?columnOrder=name&pinned=name&search=x",
    });
    result.reset();
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({ search: "x" }),
    );
  });
});
