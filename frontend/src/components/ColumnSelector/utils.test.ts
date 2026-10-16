import { describe, expect, it } from "vitest";
import type { SelectorColumn } from "./types";
import { groupPinned, sameOrder, togglePinned, unusedColumns } from "./utils";

function col(value: string, pinned = false): SelectorColumn {
  return { value, label: value.toUpperCase(), pinned };
}

const values = (columns: SelectorColumn[]) =>
  columns.map((column) => `${column.value}${column.pinned ? "*" : ""}`);

describe("unusedColumns", () => {
  it("returns the available columns not in use, in their order", () => {
    expect(
      values(unusedColumns([col("a"), col("b"), col("c")], [col("b")])),
    ).toEqual(["a", "c"]);
  });
});

describe("groupPinned", () => {
  it("moves pinned columns first, keeping each group's order", () => {
    expect(
      values(groupPinned([col("a"), col("b", true), col("c"), col("d", true)])),
    ).toEqual(["b*", "d*", "a", "c"]);
  });
});

describe("togglePinned", () => {
  it("pins a column at the end of the pinned group", () => {
    expect(
      values(togglePinned([col("a", true), col("b"), col("c")], "c")),
    ).toEqual(["a*", "c*", "b"]);
  });

  it("unpins a column to the start of the unpinned group", () => {
    expect(
      values(togglePinned([col("a", true), col("b", true), col("c")], "a")),
    ).toEqual(["b*", "a", "c"]);
  });

  it("doesn't change the input", () => {
    const columns = [col("a")];
    togglePinned(columns, "a");
    expect(columns[0].pinned).toBe(false);
  });

  it("returns the same list for an unknown column", () => {
    const columns = [col("a")];
    expect(togglePinned(columns, "x")).toBe(columns);
  });
});

describe("sameOrder", () => {
  it("compares values in order", () => {
    expect(sameOrder([col("a"), col("b")], [col("a", true), col("b")])).toBe(
      true,
    );
    expect(sameOrder([col("a"), col("b")], [col("b"), col("a")])).toBe(false);
    expect(sameOrder([col("a")], [col("a"), col("b")])).toBe(false);
  });
});
