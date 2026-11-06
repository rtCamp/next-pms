import { describe, expect, it } from "vitest";
import {
  applyHiddenWidgets,
  defaultLayout,
  hiddenWidgets,
  parseStoredLayout,
} from "./layout";

describe("defaultLayout", () => {
  it("leads with the financials for billable projects", () => {
    expect(defaultLayout("Fixed Cost")[0]).toEqual([
      "financials",
      "task_completion",
    ]);
  });

  it.each(["Non-Billable", ""])("drops them for %j", (billingType) => {
    expect(defaultLayout(billingType)[0]).toEqual(["task_completion"]);
  });

  it("ends with the contracts and rates rows", () => {
    expect(defaultLayout("Retainer").slice(-2)).toEqual([
      ["contracts"],
      ["rates"],
    ]);
  });
});

describe("parseStoredLayout", () => {
  it("drops unknown keys and empty rows", () => {
    expect(
      parseStoredLayout([["financials", "bogus"], ["bogus"], "x", [1]]),
    ).toEqual([["financials"]]);
  });

  it("parses a JSON string", () => {
    expect(parseStoredLayout('[["rates"]]')).toEqual([["rates"]]);
  });

  it.each([null, {}, "not json"])("returns null for %j", (rows) => {
    expect(parseStoredLayout(rows)).toBeNull();
  });
});

describe("hiddenWidgets / applyHiddenWidgets", () => {
  const layout = defaultLayout("Fixed Cost");

  it("finds the customizable widgets the saved layout leaves out", () => {
    const stored = applyHiddenWidgets(layout, ["budget_burn", "contracts"]);
    expect(hiddenWidgets(layout, stored)).toEqual(["budget_burn"]);
  });

  it("removes rows left empty", () => {
    const rows = applyHiddenWidgets(layout, ["budget_burn", "cost_burn"]);
    expect(rows).not.toContainEqual([]);
    expect(rows.flat()).not.toContain("budget_burn");
    expect(rows).toHaveLength(layout.length - 1);
  });
});
