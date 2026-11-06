import { describe, expect, it } from "vitest";
import {
  addedUpdateLog,
  createRiskPayload,
  deletedUpdateLog,
  editedUpdateLog,
  editRiskPayload,
  personFilterOptions,
  quickFilterCount,
  riskDetailUserIds,
  riskForm,
  riskGroups,
  riskListFilters,
  riskOrderBy,
  riskPeople,
  riskTitle,
  riskUpdateForm,
  riskUpdateItems,
  summaryText,
  toRiskItems,
  validateRiskForm,
  validateRiskUpdateForm,
  EMPTY_QUICK_FILTERS,
} from "./risks";
import type { RiskDoc, RiskRow } from "./types";

const row = (overrides: Partial<RiskRow> = {}): RiskRow => ({
  name: "RISK-1",
  project: "PROJ-1",
  risk_category: "Delivery",
  risk_level: "High",
  status: "Blocked",
  summary: "<p>Late</p>",
  owner: "ann@example.com",
  risk_owner: "bob@example.com",
  ...overrides,
});

const doc = (overrides: Partial<RiskDoc> = {}): RiskDoc => ({
  ...row(),
  modified: "2026-10-02 10:00:00",
  mitigation_plan: "<p>Plan</p>",
  risk_update_log: [
    {
      name: "u1",
      status: "To-do",
      risk_level: "Low",
      note: null,
      updated_at: "2026-10-01 10:00:00",
      updated_by: "ann@example.com",
      idx: 1,
    },
    {
      name: "u2",
      status: "Blocked",
      risk_level: "High",
      note: "<p>Stuck</p>",
      updated_at: "2026-10-02 10:00:00",
      updated_by: "bob@example.com",
      idx: 2,
    },
  ],
  ...overrides,
});

const users = new Map([
  ["bob@example.com", { name: "bob@example.com", full_name: "Bob" }],
]);

describe("riskListFilters", () => {
  it("filters by project, the set quick filters and complete conditions", () => {
    expect(
      riskListFilters(
        "PROJ-1",
        { ...EMPTY_QUICK_FILTERS, status: "Blocked", riskOwner: "b@x.com" },
        [
          { id: "1", field: "summary", operator: "like", value: "late" },
          { id: "2", field: "risk_category", operator: "=", value: "" },
        ],
      ),
    ).toEqual([
      ["project", "=", "PROJ-1"],
      ["risk_owner", "=", "b@x.com"],
      ["status", "=", "Blocked"],
      ["summary", "like", "%late%"],
    ]);
  });
});

describe("quickFilterCount", () => {
  it("counts the set quick filters", () => {
    expect(quickFilterCount(EMPTY_QUICK_FILTERS)).toBe(0);
    expect(
      quickFilterCount({
        ...EMPTY_QUICK_FILTERS,
        owner: "a",
        riskLevel: "Low",
      }),
    ).toBe(2);
  });
});

describe("riskOrderBy", () => {
  it("defaults to the last updated first", () => {
    expect(riskOrderBy(null)).toBe("modified desc");
    expect(riskOrderBy({ field: "status", order: "asc" })).toBe("status asc");
  });
});

describe("riskPeople and personFilterOptions", () => {
  it("lists each creator and risk owner once", () => {
    const people = riskPeople([
      row(),
      row({ risk_owner: null }),
      row({ owner: "bob@example.com" }),
    ]);
    expect(people).toEqual({
      owners: ["ann@example.com", "bob@example.com"],
      riskOwners: ["bob@example.com"],
    });
    expect(personFilterOptions("All owners", people.owners, users)).toEqual([
      { label: "All owners", value: "" },
      { label: "ann@example.com", value: "ann@example.com" },
      { label: "Bob", value: "bob@example.com" },
    ]);
  });
});

describe("riskGroups", () => {
  it("puts mitigated risks in their own group and the rest, statusless too, in open", () => {
    const items = toRiskItems(
      [
        row({ name: "a" }),
        row({ name: "b", status: "Mitigated" }),
        row({ name: "c", status: null, risk_owner: null }),
      ],
      users,
    );
    const [open, mitigated] = riskGroups(items);
    expect(open.rows.map((item) => item.name)).toEqual(["a", "c"]);
    expect(mitigated.rows.map((item) => item.name)).toEqual(["b"]);
    expect(items[0].riskOwnerPerson).toEqual({
      userId: "bob@example.com",
      label: "Bob",
      image: undefined,
    });
    expect(items[2].riskOwnerPerson).toBeNull();
  });
});

describe("riskTitle and summaryText", () => {
  it("names a risk by its category, else its ID", () => {
    expect(riskTitle(row())).toBe("Delivery Risk");
    expect(riskTitle(row({ risk_category: null }))).toBe("RISK-1");
  });

  it("shows a summary as text, or a dash", () => {
    expect(summaryText("<p>Late&nbsp;<b>again</b></p>")).toBe("Late again");
    expect(summaryText(null)).toBe("—");
    expect(summaryText("<p></p>")).toBe("—");
  });
});

describe("riskUpdateItems and riskDetailUserIds", () => {
  it("shows updates newest first with their authors", () => {
    const items = riskUpdateItems(doc().risk_update_log ?? [], users);
    expect(items.map((item) => item.name)).toEqual(["u2", "u1"]);
    expect(items[0].author.label).toBe("Bob");
    expect(items[1].author.label).toBe("ann@example.com");
  });

  it("collects the creator, owner and authors", () => {
    expect(riskDetailUserIds(doc())).toEqual([
      "ann@example.com",
      "bob@example.com",
      "ann@example.com",
      "bob@example.com",
    ]);
    expect(riskDetailUserIds(null)).toEqual([]);
  });
});

describe("the risk form", () => {
  it("starts a new risk owned by the project manager", () => {
    expect(riskForm(null, "pm@example.com")).toEqual({
      risk_category: "",
      risk_level: "",
      status: "",
      risk_owner: "pm@example.com",
      summary: "",
      mitigation_plan: "",
    });
    expect(riskForm(doc(), "pm@example.com").risk_owner).toBe(
      "bob@example.com",
    );
  });

  it("needs a level and status only on create", () => {
    const empty = riskForm(null);
    expect(validateRiskForm(empty, false)).toEqual({
      risk_level: "Please select a risk level.",
      status: "Please select a status.",
    });
    expect(validateRiskForm(empty, true)).toEqual({});
  });

  it("leaves empty optional fields out of a new risk", () => {
    expect(
      createRiskPayload("PROJ-1", {
        ...riskForm(null),
        risk_level: "Low",
        status: "To-do",
        summary: "<p></p>",
      }),
    ).toEqual({ project: "PROJ-1", risk_level: "Low", status: "To-do" });
  });

  it("sends cleared fields on edit, and never the status or level", () => {
    expect(
      editRiskPayload({
        ...riskForm(doc()),
        risk_category: "",
        summary: "<p></p>",
        mitigation_plan: "",
      }),
    ).toEqual({
      risk_category: null,
      risk_owner: "bob@example.com",
      summary: "",
      mitigation_plan: "",
    });
  });
});

describe("the update form and log", () => {
  it("starts from the risk's status and level, or the update's values", () => {
    const risk = doc();
    expect(riskUpdateForm(risk)).toEqual({
      status: "Blocked",
      risk_level: "High",
      note: "",
    });
    expect(riskUpdateForm(risk, risk.risk_update_log?.[1])).toEqual({
      status: "Blocked",
      risk_level: "High",
      note: "<p>Stuck</p>",
    });
  });

  it("needs a note with text", () => {
    expect(
      validateRiskUpdateForm({ status: "", risk_level: "", note: "<p> </p>" }),
    ).toEqual({ note: "Note is required." });
    expect(
      validateRiskUpdateForm({ status: "", risk_level: "", note: "<p>x</p>" }),
    ).toEqual({});
  });

  it("appends a new update last, keeping the others' authors", () => {
    const log = addedUpdateLog(doc(), {
      status: "Mitigated",
      risk_level: "",
      note: "<p>Done</p>",
    });
    expect(log.map((update) => update.name)).toEqual(["u1", "u2", undefined]);
    expect(log[2]).toEqual({ status: "Mitigated", note: "<p>Done</p>" });
    expect(log[0].updated_by).toBe("ann@example.com");
  });

  it("edits an update in place", () => {
    const log = editedUpdateLog(doc(), "u1", {
      status: "",
      risk_level: "Medium",
      note: "<p>Edited</p>",
    });
    expect(log.map((update) => update.name)).toEqual(["u1", "u2"]);
    expect(log[0]).toMatchObject({
      status: "To-do",
      risk_level: "Medium",
      note: "<p>Edited</p>",
      updated_by: "ann@example.com",
    });
  });

  it("deletes the latest update, leaving the earlier one last", () => {
    const log = deletedUpdateLog(doc(), "u2");
    expect(log).toEqual([
      {
        name: "u1",
        status: "To-do",
        risk_level: "Low",
        note: null,
        updated_at: "2026-10-01 10:00:00",
        updated_by: "ann@example.com",
      },
    ]);
  });
});
