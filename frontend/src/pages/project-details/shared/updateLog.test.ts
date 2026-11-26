import { describe, expect, it } from "vitest";
import {
  newestFirst,
  toUpdateLogRows,
  withAddedUpdate,
  withEditedUpdate,
  withoutUpdate,
} from "./updateLog";

interface Row {
  name?: string;
  status?: string | null;
  level?: string | null;
  note?: string | null;
  updated_at?: string;
  updated_by?: string;
  idx?: number;
  creation?: string;
}

const FIELDS = ["status", "level", "note"] as const;

const rows: Row[] = [
  {
    name: "a",
    status: "To-do",
    level: "Low",
    note: null,
    updated_at: "2026-10-01 10:00:00",
    updated_by: "ann@example.com",
    idx: 1,
    creation: "2026-10-01 10:00:00",
  },
  {
    name: "b",
    status: "Blocked",
    level: "High",
    note: "<p>Stuck</p>",
    updated_at: "2026-10-02 10:00:00",
    updated_by: "bob@example.com",
    idx: 2,
    creation: "2026-10-02 10:00:00",
  },
];

describe("toUpdateLogRows", () => {
  it("keeps the stored order, the given fields and the audit fields", () => {
    expect(toUpdateLogRows(rows, FIELDS)).toEqual([
      {
        name: "a",
        status: "To-do",
        level: "Low",
        note: null,
        updated_at: "2026-10-01 10:00:00",
        updated_by: "ann@example.com",
      },
      {
        name: "b",
        status: "Blocked",
        level: "High",
        note: "<p>Stuck</p>",
        updated_at: "2026-10-02 10:00:00",
        updated_by: "bob@example.com",
      },
    ]);
  });
});

describe("withAddedUpdate", () => {
  it("appends the new row last", () => {
    const result = withAddedUpdate(rows, FIELDS, { status: "Mitigated" });
    expect(result.map((row) => row.name)).toEqual(["a", "b", undefined]);
    expect(result[2]).toEqual({ status: "Mitigated" });
    expect(result[0]).not.toHaveProperty("idx");
  });
});

describe("withEditedUpdate", () => {
  it("changes only the named row, in place", () => {
    const result = withEditedUpdate(rows, FIELDS, "a", { note: "<p>Hi</p>" });
    expect(result.map((row) => row.name)).toEqual(["a", "b"]);
    expect(result[0]).toMatchObject({
      note: "<p>Hi</p>",
      status: "To-do",
      updated_by: "ann@example.com",
    });
    expect(result[1]).toEqual(toUpdateLogRows(rows, FIELDS)[1]);
  });
});

describe("withoutUpdate", () => {
  it("drops the named row and keeps the others' order and authors", () => {
    const three = [
      ...rows,
      { ...rows[0], name: "c", updated_at: "2026-10-03" },
    ];
    expect(withoutUpdate(three, FIELDS, "b")).toEqual([
      toUpdateLogRows(three, FIELDS)[0],
      toUpdateLogRows(three, FIELDS)[2],
    ]);
  });

  it("leaves the previous row last when the latest is deleted", () => {
    const result = withoutUpdate(rows, FIELDS, "b");
    expect(result.at(-1)).toMatchObject({ name: "a", status: "To-do" });
  });
});

describe("newestFirst", () => {
  it("sorts by updated_at, newest first", () => {
    expect(newestFirst(rows).map((row) => row.name)).toEqual(["b", "a"]);
  });

  it("puts the later stored row first on a tie", () => {
    const tied = rows.map((row) => ({ ...row, updated_at: "2026-10-01" }));
    expect(newestFirst(tied).map((row) => row.name)).toEqual(["b", "a"]);
  });

  it("doesn't change the input", () => {
    const input = [...rows];
    newestFirst(input);
    expect(input).toEqual(rows);
  });
});
