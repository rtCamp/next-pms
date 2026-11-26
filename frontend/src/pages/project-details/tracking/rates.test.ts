import { describe, expect, it } from "vitest";
import {
  toFlatRate,
  toRateRows,
  validateRate,
  withEditedRate,
  withRate,
} from "./rates";

const money = (value: number) => `$${value}`;

describe("toRateRows", () => {
  it("keys rows by name and sorts by valid-from, newest first", () => {
    const rows = toRateRows(
      [
        {
          name: "r1",
          employee: "EMP-1",
          employee_name: "Ann",
          image: null,
          hourly_billing_rate: 10,
          valid_from: "2026-01-01",
        },
        {
          name: "r2",
          employee: "EMP-1",
          employee_name: null,
          image: "/a.png",
          hourly_billing_rate: null,
          valid_from: "2026-05-01",
        },
      ],
      money,
    );
    expect(rows).toEqual([
      {
        id: "r2",
        employee: "EMP-1",
        employeeName: "EMP-1",
        image: "/a.png",
        amount: "$0/h",
        hourlyRate: 0,
        date: "2026-05-01",
      },
      {
        id: "r1",
        employee: "EMP-1",
        employeeName: "Ann",
        image: undefined,
        amount: "$10/h",
        hourlyRate: 10,
        date: "2026-01-01",
      },
    ]);
  });
});

describe("toFlatRate", () => {
  it("formats the flat rate", () => {
    expect(
      toFlatRate({ flat_rate_hourly: 5, flat_rate_valid_from: null }, money),
    ).toEqual({ amount: "$5/h", date: "" });
  });
});

describe("validateRate", () => {
  it("accepts a complete rate", () => {
    expect(
      validateRate({ employee: "E", hourlyRate: "5", validFrom: "2026-01-01" }),
    ).toEqual({});
  });

  it("reports each missing field", () => {
    expect(
      validateRate({ employee: "", hourlyRate: "", validFrom: "" }),
    ).toEqual({
      employee: "Please select an employee",
      hourlyRate: "Please enter an hourly rate.",
      validFrom: "Please select a valid-from date.",
    });
  });

  it("rejects a rate of 0", () => {
    expect(
      validateRate({ employee: "E", hourlyRate: "0", validFrom: "x" })
        .hourlyRate,
    ).toBe("Hourly rate must be greater than 0.");
  });
});

describe("child table updates", () => {
  const current = [{ name: "a", employee: "E1", valid_from: "2026-01-01" }];
  const input = { employee: "E2", hourlyRate: 9, validFrom: "2026-02-01" };

  it("adds a rate", () => {
    expect(withRate(current, input).at(-1)).toEqual({
      employee: "E2",
      hourly_billing_rate: 9,
      valid_from: "2026-02-01",
    });
  });

  it("edits a rate in place", () => {
    expect(withEditedRate(current, "a", input)).toEqual([
      {
        name: "a",
        employee: "E2",
        hourly_billing_rate: 9,
        valid_from: "2026-02-01",
      },
    ]);
  });
});
