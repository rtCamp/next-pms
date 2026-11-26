import { describe, expect, it } from "vitest";
import { changedFields, tableValues, toForm } from "./systemSettings";

describe("tableValues", () => {
  it("takes one column, without blanks", () => {
    expect(
      tableValues([{ role: "HR User" }, { role: "" }, {}], "role"),
    ).toEqual(["HR User"]);
    expect(tableValues(undefined, "role")).toEqual([]);
  });
});

describe("toForm", () => {
  it("keeps the edited fields and trims child rows to their value", () => {
    const form = toForm({
      name: "Timesheet Settings",
      allow_future_entries: 1,
      ignored_role: [{ role: "HR User", name: "row1", idx: 1 } as never],
      designations: [{ designation: "Engineer" }],
      pm_report_api_key: "*****",
    } as never);
    expect(form).toMatchObject({
      allow_future_entries: 1,
      ignored_role: [{ role: "HR User" }],
      allowed_departments: [],
      designations: [{ designation: "Engineer" }],
    });
    expect(form).not.toHaveProperty("name");
    expect(form).not.toHaveProperty("pm_report_api_key");
  });
});

describe("changedFields", () => {
  const saved = toForm({
    name: "Timesheet Settings",
    allow_future_entries: 0,
    remind_on: "Monday",
    designations: [{ designation: "Engineer" }],
  });

  it("is empty when nothing changed", () => {
    expect(changedFields(saved, toForm({ ...saved, name: "" }))).toEqual({});
  });

  it("returns only the changed fields", () => {
    expect(
      changedFields(saved, {
        ...saved,
        allow_future_entries: 1,
        designations: [{ designation: "Engineer" }, { designation: "Lead" }],
      }),
    ).toEqual({
      allow_future_entries: 1,
      designations: [{ designation: "Engineer" }, { designation: "Lead" }],
    });
  });

  it("sends a cleared field as null", () => {
    expect(changedFields(saved, { ...saved, remind_on: undefined })).toEqual({
      remind_on: null,
    });
  });

  it("treats a missing and an empty value alike", () => {
    expect(
      changedFields(
        { ...saved, daily_reminder_template: undefined },
        {
          ...saved,
          daily_reminder_template: null,
        },
      ),
    ).toEqual({});
  });
});
