import { describe, expect, it } from "vitest";
import type { FilterCondition } from "@/components/Filter";
import {
  buildFilterConditions,
  isCompleteFilterCondition,
  isNoValueOperator,
  normalizeLikeFilterValue,
} from "./filters";

function condition(
  field: string,
  operator: string,
  value: FilterCondition["value"],
): FilterCondition {
  return { field, operator, value } as FilterCondition;
}

describe("isNoValueOperator", () => {
  it("is true only for the empty checks", () => {
    expect(isNoValueOperator("is_empty")).toBe(true);
    expect(isNoValueOperator("is_not_empty")).toBe(true);
    expect(isNoValueOperator("=")).toBe(false);
  });
});

describe("isCompleteFilterCondition", () => {
  it("needs a field and an operator", () => {
    expect(isCompleteFilterCondition(condition("", "=", "a"))).toBe(false);
    expect(isCompleteFilterCondition(condition("status", "", "a"))).toBe(false);
  });

  it("needs no value for a no-value operator", () => {
    expect(
      isCompleteFilterCondition(condition("status", "is_empty", null)),
    ).toBe(true);
  });

  it.each([null, undefined, "", "   ", []])(
    "is incomplete with the value %j",
    (value) => {
      expect(
        isCompleteFilterCondition(
          condition("status", "=", value as FilterCondition["value"]),
        ),
      ).toBe(false);
    },
  );

  it.each(["Open", 0, ["Open"]])("is complete with the value %j", (value) => {
    expect(
      isCompleteFilterCondition(
        condition("status", "=", value as FilterCondition["value"]),
      ),
    ).toBe(true);
  });
});

describe("normalizeLikeFilterValue", () => {
  it("wraps a like value in wildcards", () => {
    expect(normalizeLikeFilterValue("like", " api ")).toBe("%api%");
    expect(normalizeLikeFilterValue(" NOT LIKE ", "api")).toBe("%api%");
  });

  it("keeps a value that already has a wildcard", () => {
    expect(normalizeLikeFilterValue("like", "api%")).toBe("api%");
    expect(normalizeLikeFilterValue("like", "%api")).toBe("%api");
  });

  it("leaves an empty like value empty", () => {
    expect(normalizeLikeFilterValue("like", "  ")).toBe("");
  });

  it("leaves other operators and non-string values alone", () => {
    expect(normalizeLikeFilterValue("=", " api ")).toBe(" api ");
    expect(normalizeLikeFilterValue("like", ["a"])).toEqual(["a"]);
  });
});

describe("buildFilterConditions", () => {
  it("turns complete conditions into Frappe filters", () => {
    expect(
      buildFilterConditions([
        condition("priority", "=", "Urgent"),
        condition("subject", "like", "login"),
        condition("project", "is_empty", "ignored"),
        condition("status", "=", ""),
      ]),
    ).toEqual([
      ["priority", "=", "Urgent"],
      ["subject", "like", "%login%"],
      ["project", "is_empty", null],
    ]);
  });
});
