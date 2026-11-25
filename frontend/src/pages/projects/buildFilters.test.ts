import { describe, expect, it } from "vitest";
import { buildProjectFilters } from "./buildFilters";
import type { ProjectListFilters } from "./types";

const FILTERS: ProjectListFilters = {
  search: "",
  ragStatus: [],
  phase: "",
  status: "",
  advanced: [],
  currency: "",
};

describe("buildProjectFilters", () => {
  it("filters child-table fields on the child doctype", () => {
    expect(
      buildProjectFilters({
        ...FILTERS,
        advanced: [
          { id: "1", field: "custom_host", operator: "=", value: "AWS" },
          {
            id: "2",
            field: "delivery_accelerators",
            operator: "=",
            value: "Garuda",
          },
        ],
      }),
    ).toEqual([
      ["custom_host", "=", "AWS"],
      ["Project Delivery Accelerator", "delivery_accelerator", "=", "Garuda"],
    ]);
  });
});
