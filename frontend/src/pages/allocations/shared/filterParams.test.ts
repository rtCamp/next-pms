import { describe, expect, it } from "vitest";
import type { FilterCondition } from "@/components/Filter";
import {
  compositeFiltersParam,
  normalizeAllocationTypes,
  parseAllocationTypes,
  projectAllocationTypeParams,
  resolveAllocationTypes,
  sortedListParam,
  teamAllocationTypeParams,
} from "./filterParams";

describe("parseAllocationTypes", () => {
  it("keeps the known options once, in order", () => {
    expect(
      parseAllocationTypes([
        "billable",
        3,
        "everything",
        "billable",
        "Tentative",
      ]),
    ).toEqual(["billable", "Tentative"]);
  });
});

describe("resolveAllocationTypes", () => {
  it("unions the billable options", () => {
    expect(resolveAllocationTypes(["billable", "non-billable"])).toMatchObject({
      billableValues: [1, 0],
      includeUnallocated: false,
    });
  });

  it("drops the statuses when No allocation is the only presence option", () => {
    expect(
      resolveAllocationTypes(["no-allocation", "Confirmed"]),
    ).toMatchObject({ statuses: [], isStatusApplicable: false });
  });

  it("keeps the statuses alongside another presence option", () => {
    expect(
      resolveAllocationTypes(["no-allocation", "billable", "Tentative"]),
    ).toMatchObject({ statuses: ["Tentative"], isStatusApplicable: true });
    expect(
      resolveAllocationTypes(["no-allocation", "ai-created", "Confirmed"]),
    ).toMatchObject({ statuses: ["Confirmed"], aiCreatedOnly: true });
  });
});

describe("normalizeAllocationTypes", () => {
  it("returns the same list when every option applies", () => {
    const values = ["Confirmed" as const, "billable" as const];
    expect(normalizeAllocationTypes(values)).toBe(values);
  });

  it("removes statuses that can't apply", () => {
    expect(normalizeAllocationTypes(["Confirmed", "no-allocation"])).toEqual([
      "no-allocation",
    ]);
  });
});

describe("teamAllocationTypeParams", () => {
  it("sends nothing for an empty selection", () => {
    expect(teamAllocationTypeParams([])).toEqual({
      allocation_status: undefined,
      is_billable: undefined,
      is_ai_created: undefined,
      no_allocation: false,
    });
  });

  it("sends statuses and billable values as JSON lists", () => {
    expect(
      teamAllocationTypeParams([
        "Tentative",
        "Confirmed",
        "non-billable",
        "ai-created",
        "no-allocation",
      ]),
    ).toEqual({
      allocation_status: '["Confirmed","Tentative"]',
      is_billable: "[0]",
      is_ai_created: 1,
      no_allocation: true,
    });
  });
});

describe("projectAllocationTypeParams", () => {
  it("sends one status as a list and one billable flag as a scalar", () => {
    expect(projectAllocationTypeParams(["Tentative", "billable"])).toEqual({
      allocation_status: '["Tentative"]',
      is_billable: "1",
      is_ai_created: undefined,
    });
  });

  it("sends nothing for an axis with both options picked", () => {
    expect(
      projectAllocationTypeParams([
        "Confirmed",
        "Tentative",
        "billable",
        "non-billable",
      ]),
    ).toEqual({
      allocation_status: undefined,
      is_billable: undefined,
      is_ai_created: undefined,
    });
  });
});

describe("compositeFiltersParam", () => {
  const condition = (
    field: string,
    operator: string,
    value: FilterCondition["value"],
  ): FilterCondition => ({ id: field, field, operator, value });

  it("turns complete conditions into Frappe filters", () => {
    expect(
      compositeFiltersParam([
        condition("skills", "like", "vue"),
        condition("tag", "=", ""),
        condition("business_unit", "=", "Tech"),
      ]),
    ).toBe('[["skills","like","%vue%"],["business_unit","=","Tech"]]');
  });

  it("is undefined without a complete condition", () => {
    expect(compositeFiltersParam([])).toBeUndefined();
    expect(compositeFiltersParam([condition("tag", "", "x")])).toBeUndefined();
  });
});

describe("sortedListParam", () => {
  it("sorts and de-duplicates", () => {
    expect(sortedListParam(["QA", "Dev", "QA"])).toBe('["Dev","QA"]');
  });

  it("is undefined for an empty list", () => {
    expect(sortedListParam([])).toBeUndefined();
  });
});
