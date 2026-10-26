import { describe, expect, it } from "vitest";
import {
  addedGrowthUpdateLog,
  closedStatuses,
  createGrowthPayload,
  deletedGrowthUpdateLog,
  editedGrowthUpdateLog,
  editGrowthPayload,
  EMPTY_GROWTH_FILTERS,
  growthDetails,
  growthDetailUserIds,
  growthForm,
  growthGroups,
  growthListFilters,
  growthOrderBy,
  growthPeople,
  growthUpdateForm,
  growthUpdateItems,
  hasActiveFilters,
  isClosingStatus,
  nameFilterOptions,
  openStatuses,
  ownerFilterOptions,
  toGrowthItems,
  validateGrowthForm,
  validateGrowthUpdateForm,
} from "./growth";
import type { GrowthDoc, GrowthRow, GrowthStatus } from "./types";

const ANN = "ann@example.com";
const BOB = "bob@example.com";

const row = (overrides: Partial<GrowthRow> = {}): GrowthRow => ({
  name: "G-1",
  project: "PROJ-1",
  activity: "Upsell hosting",
  category: "Upsell",
  client_priority: "High",
  status: "In Progress",
  is_closed: 0,
  closed_status: null,
  activity_owner: ANN,
  ideation_owner: BOB,
  modified: "2026-10-02 10:00:00.000000",
  ...overrides,
});

const doc = (overrides: Partial<GrowthDoc> = {}): GrowthDoc => ({
  ...row(),
  ideation_date: "2026-10-01",
  billable_outcome: 500,
  description: "<p>Idea</p>",
  desired_outcome: null,
  owner: ANN,
  update_log: [
    {
      name: "u1",
      status: "Ideation",
      closed_status: null,
      client_priority: "Low",
      billable_outcome: 0,
      note: null,
      updated_at: "2026-10-01 10:00:00",
      updated_by: ANN,
    },
    {
      name: "u2",
      status: "In Progress",
      closed_status: null,
      client_priority: "High",
      billable_outcome: 500,
      note: "<p>Go</p>",
      updated_at: "2026-10-02 10:00:00",
      updated_by: BOB,
    },
  ],
  ...overrides,
});

const users = new Map([
  [BOB, { name: BOB, full_name: "Bob", user_image: "/b.png" }],
]);

const STATUSES: GrowthStatus[] = [
  { name: "Closed", status_type: "Status", is_closed: 1 },
  { name: "Ideation", status_type: "Status", is_closed: 0 },
  { name: "Won", status_type: "Closed Status", is_closed: 0 },
];

describe("growth list helpers", () => {
  it("filters by project and the set filters", () => {
    expect(
      growthListFilters("PROJ-1", {
        ...EMPTY_GROWTH_FILTERS,
        ideationOwner: BOB,
        category: "Upsell",
      }),
    ).toEqual([
      ["project", "=", "PROJ-1"],
      ["ideation_owner", "=", BOB],
      ["category", "=", "Upsell"],
    ]);
    expect(hasActiveFilters(EMPTY_GROWTH_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_GROWTH_FILTERS, status: "x" })).toBe(
      true,
    );
  });

  it("sorts by the last updated first unless picked", () => {
    expect(growthOrderBy(null)).toBe("modified desc");
    expect(growthOrderBy({ field: "activity", order: "asc" })).toBe(
      "activity asc",
    );
  });

  it("offers each owner once, by name", () => {
    const people = growthPeople([
      row(),
      row({ activity_owner: BOB, ideation_owner: null }),
      row(),
    ]);
    expect(people).toEqual({
      activityOwners: [ANN, BOB],
      ideationOwners: [BOB],
    });
    expect(ownerFilterOptions(people.activityOwners, users)).toEqual([
      { label: ANN, value: ANN, image: undefined },
      { label: "Bob", value: BOB, image: "/b.png" },
    ]);
  });

  it("builds master options and splits statuses by type", () => {
    expect(nameFilterOptions("All statuses", openStatuses(STATUSES))).toEqual([
      { label: "All statuses", value: "" },
      { label: "Closed", value: "Closed" },
      { label: "Ideation", value: "Ideation" },
    ]);
    expect(closedStatuses(STATUSES).map((s) => s.name)).toEqual(["Won"]);
    expect(isClosingStatus(STATUSES, "Closed")).toBe(true);
    expect(isClosingStatus(STATUSES, "Ideation")).toBe(false);
  });

  it("groups by closed and gives each group its columns", () => {
    const [open, closed] = growthGroups(
      toGrowthItems([row(), row({ name: "G-2", is_closed: 1 })], users),
    );
    expect(open.rows.map((item) => item.name)).toEqual(["G-1"]);
    expect(closed.rows.map((item) => item.name)).toEqual(["G-2"]);
    expect(open.columns.map((column) => column.key)).toContain(
      "client_priority",
    );
    expect(closed.columns.map((column) => column.key)).toContain(
      "closed_status",
    );
    expect(open.rows[0].ownerPerson?.label).toBe(ANN);
  });
});

describe("growth detail helpers", () => {
  it("shows updates in the stored order reversed", () => {
    const items = growthUpdateItems(doc().update_log ?? [], users);
    expect(items.map((item) => item.name)).toEqual(["u2", "u1"]);
    expect(items[0].author.label).toBe("Bob");
  });

  it("collects the owners and authors", () => {
    expect(growthDetailUserIds(doc())).toEqual([ANN, BOB, ANN, BOB]);
    expect(growthDetailUserIds(null)).toEqual([]);
  });

  it("lists the details", () => {
    const details = growthDetails(doc({ category: null }), "USD");
    expect(details.map((detail) => detail.label)).toEqual([
      "Category",
      "Ideation date",
      "Billable outcome",
      "Last updated",
    ]);
    expect(details[0].value).toBe("—");
    expect(details[2].value).toBe("$500.00");
  });
});

describe("the initiative form", () => {
  it("starts a new initiative dated today", () => {
    const form = growthForm(null, "2026-10-26");
    expect(form.ideation_date).toBe("2026-10-26");
    expect(form.billable_outcome).toBe("");
    expect(growthForm(doc(), "2026-10-26").billable_outcome).toBe("500");
  });

  it("needs an activity, status and date, a closed status when closing, and no negative amount", () => {
    expect(validateGrowthForm(growthForm(null, ""), false)).toEqual({
      activity: "Please enter an activity.",
      status: "Please select a status.",
      ideation_date: "Please pick an ideation date.",
    });
    expect(
      validateGrowthForm(
        {
          ...growthForm(doc(), ""),
          status: "Closed",
          billable_outcome: "-1",
        },
        true,
      ),
    ).toEqual({
      closed_status: "Please select a closed status.",
      billable_outcome: "Billable outcome must be zero or greater.",
    });
  });

  it("clears empty links on edit and sends the update values on create", () => {
    const form = { ...growthForm(doc(), ""), category: "", ideation_owner: "" };
    expect(editGrowthPayload(form)).toEqual({
      activity: "Upsell hosting",
      category: null,
      description: "<p>Idea</p>",
      desired_outcome: "",
      ideation_date: "2026-10-01",
      activity_owner: ANN,
      ideation_owner: null,
    });
    expect(
      createGrowthPayload(
        "PROJ-1",
        {
          ...form,
          status: "Closed",
          closed_status: "Won",
          billable_outcome: "",
        },
        true,
      ),
    ).toMatchObject({
      project: "PROJ-1",
      status: "Closed",
      closed_status: "Won",
      client_priority: "High",
      billable_outcome: 0,
    });
    expect(
      createGrowthPayload("PROJ-1", { ...form, closed_status: "Won" }, false)
        .closed_status,
    ).toBeNull();
  });
});

describe("the update form and log", () => {
  it("starts from the initiative's values, or the update's", () => {
    expect(growthUpdateForm(doc())).toEqual({
      status: "In Progress",
      closed_status: "",
      client_priority: "High",
      billable_outcome: "500",
      note: "",
    });
    expect(growthUpdateForm(doc(), doc().update_log?.[0]).client_priority).toBe(
      "Low",
    );
  });

  it("needs a note, and a closed status when closing", () => {
    const form = growthUpdateForm(doc());
    expect(validateGrowthUpdateForm(form, true)).toEqual({
      closed_status: "Please select a closed status.",
      note: "Note is required.",
    });
    expect(
      validateGrowthUpdateForm({ ...form, note: "<p>x</p>" }, false),
    ).toEqual({});
  });

  it("appends an update with what it sets, keeping the others whole", () => {
    const log = addedGrowthUpdateLog(
      doc(),
      {
        status: "Closed",
        closed_status: "Won",
        client_priority: "",
        billable_outcome: "",
        note: "<p>Won</p>",
      },
      true,
    );
    expect(log.map((update) => update.name)).toEqual(["u1", "u2", undefined]);
    expect(log[2]).toEqual({
      status: "Closed",
      closed_status: "Won",
      note: "<p>Won</p>",
    });
    expect(log[1]).toMatchObject({ updated_by: BOB, billable_outcome: 500 });
  });

  it("edits an update in place and drops a closed status when reopening", () => {
    const log = editedGrowthUpdateLog(
      doc(),
      "u2",
      {
        status: "Ideation",
        closed_status: "Won",
        client_priority: "Medium",
        billable_outcome: "0",
        note: "<p>Back</p>",
      },
      false,
    );
    expect(log[1]).toMatchObject({
      name: "u2",
      status: "Ideation",
      closed_status: null,
      client_priority: "Medium",
      billable_outcome: 0,
      updated_by: BOB,
    });
  });

  it("deletes an update, keeping the rest in order", () => {
    expect(
      deletedGrowthUpdateLog(doc(), "u2").map((update) => update.name),
    ).toEqual(["u1"]);
  });
});
