import { resolveExtensions } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { richTextExtensions } from "./kits";

function extensionNames(options?: Parameters<typeof richTextExtensions>[0]) {
  return resolveExtensions(richTextExtensions(options)).map(
    (extension) => extension.name,
  );
}

describe("richTextExtensions", () => {
  it("includes task lists by default", () => {
    expect(extensionNames()).toEqual(
      expect.arrayContaining(["taskList", "taskItem"]),
    );
  });

  it("drops task lists with taskList: false", () => {
    const names = extensionNames({ taskList: false });
    expect(names).not.toContain("taskList");
    expect(names).not.toContain("taskItem");
    expect(names).toContain("bulletList");
  });
});
