import { describe, expect, it } from "vitest";
import { groupRowMinWidth } from "./groups";

describe("groupRowMinWidth", () => {
  it("adds the ⋯ column and a gap per column to the widths", () => {
    expect(
      groupRowMinWidth([
        { key: "a", label: "A", width: "128px", flex: 1 },
        { key: "b", label: "B", width: "74px", flex: 0 },
      ]),
    ).toBe(128 + 74 + 32 + 16);
  });
});
