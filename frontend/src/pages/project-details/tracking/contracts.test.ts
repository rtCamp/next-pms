import { describe, expect, it } from "vitest";
import {
  toContractRows,
  validateContract,
  withContract,
  withEditedContract,
  withoutRow,
  type ContractForm,
} from "./contracts";

const form = (overrides: Partial<ContractForm> = {}): ContractForm => ({
  startDate: "2026-01-01",
  endDate: "2026-01-31",
  hoursBought: "10",
  salesOrder: "",
  salesInvoice: "",
  ...overrides,
});

describe("validateContract", () => {
  it("accepts a complete contract", () => {
    expect(validateContract(form())).toEqual({});
  });

  it("requires both dates and hours", () => {
    expect(
      validateContract(form({ startDate: "", endDate: "", hoursBought: " " })),
    ).toEqual({
      startDate: "Please select a start date.",
      endDate: "Please select an end date.",
      hoursBought: "Please enter hours bought.",
    });
  });

  it.each(["0", "-2", "abc"])("rejects %j hours", (hoursBought) => {
    expect(validateContract(form({ hoursBought })).hoursBought).toBe(
      "Hours bought must be greater than 0.",
    );
  });

  it("rejects an end before the start", () => {
    expect(validateContract(form({ endDate: "2025-12-31" })).endDate).toBe(
      "End date must be on or after start date.",
    );
  });
});

describe("toContractRows", () => {
  it("formats the hours and falls back for the id", () => {
    const [row] = toContractRows([
      {
        name: "",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        hours_purchased: 10.456,
        consumed_hours: 2,
        remaining_hours: 8.456,
        sales_order: "SO-1",
        sales_invoice: null,
      },
    ]);
    expect(row).toMatchObject({
      id: "SO-1",
      hoursBought: "10.46",
      hoursUsed: "2",
      hoursLeft: "8.46",
      salesInvoice: "",
    });
  });
});

describe("child table updates", () => {
  const current = [
    {
      name: "a",
      start_date: "2026-01-01",
      end_date: "2026-01-31",
      hours_purchased: 5,
    },
    {
      name: "b",
      start_date: "2026-02-01",
      end_date: "2026-02-28",
      hours_purchased: 6,
    },
  ];
  const input = {
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    hoursBought: 7,
    salesOrder: "SO-1",
  };

  it("adds a row", () => {
    expect(withContract(current, input).at(-1)).toEqual({
      start_date: "2026-03-01",
      end_date: "2026-03-31",
      hours_purchased: 7,
      sales_order: "SO-1",
      sales_invoice: "",
    });
  });

  it("edits a row in place", () => {
    const rows = withEditedContract(current, "b", input);
    expect(rows[0]).toBe(current[0]);
    expect(rows[1]).toMatchObject({ name: "b", hours_purchased: 7 });
  });

  it("removes a row", () => {
    expect(withoutRow(current, "a").map((row) => row.name)).toEqual(["b"]);
  });
});
