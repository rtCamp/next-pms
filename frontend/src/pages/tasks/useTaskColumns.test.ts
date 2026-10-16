import { afterEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import { unmountAll, withSetup } from "@/test/withSetup";
import { AVAILABLE_TASK_COLUMNS, useTaskColumns } from "./useTaskColumns";

afterEach(unmountAll);

const keys = (columns: { key: string }[]) =>
  columns.map((column) => column.key);

describe("useTaskColumns", () => {
  it("shows every data column, then the action columns, by default", async () => {
    const { result } = await withSetup(useTaskColumns, { route: "/tasks" });
    expect(keys(result.columns.value)).toEqual([
      "subject",
      "project_name",
      "status",
      "expected_time",
      "priority",
      "exp_end_date",
      "like",
      "actions",
    ]);
    expect(result.isDefault.value).toBe(true);
    expect(AVAILABLE_TASK_COLUMNS).toHaveLength(6);
  });

  it("reads the order from the URL, ignoring unknown keys", async () => {
    const { result } = await withSetup(useTaskColumns, {
      route: "/tasks?columnOrder=status,bogus,subject",
    });
    expect(keys(result.columns.value)).toEqual([
      "status",
      "subject",
      "like",
      "actions",
    ]);
    expect(result.selectedColumns.value).toEqual([
      { value: "status", label: "Status" },
      { value: "subject", label: "Subject" },
    ]);
    expect(result.isDefault.value).toBe(false);
  });

  it("falls back to the default when no key is known", async () => {
    const { result } = await withSetup(useTaskColumns, {
      route: "/tasks?columnOrder=bogus",
    });
    expect(result.isDefault.value).toBe(true);
  });

  it("writes the selected columns to the URL", async () => {
    const { result, router } = await withSetup(useTaskColumns, {
      route: "/tasks",
    });
    result.selectedColumns.value = [
      { value: "priority", label: "Priority" },
      { value: "subject", label: "Subject" },
    ];
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({
        columnOrder: "priority,subject",
      }),
    );
  });

  it("drops the param for the default order and on reset", async () => {
    const { result, router } = await withSetup(useTaskColumns, {
      route: "/tasks?columnOrder=status&search=x",
    });
    result.reset();
    await vi.waitFor(() =>
      expect(router.currentRoute.value.query).toEqual({ search: "x" }),
    );
  });
});
