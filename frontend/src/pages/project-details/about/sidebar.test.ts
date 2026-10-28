import { describe, expect, it } from "vitest";
import {
  budgetNotSetHint,
  formatHoursLabel,
  managerOptions,
  planManagerChange,
  removeBlockedReason,
  splitMembers,
  targetNotSetHint,
  toMembers,
} from "./sidebar";
import type { ProjectSidebar, SidebarMember } from "./types";

function member(user: string, roles: string[] = []): SidebarMember {
  return {
    user,
    employee: `EMP-${user}`,
    full_name: user.toUpperCase(),
    image: null,
    designation: null,
    department: null,
    cell_number: null,
    company_email: null,
    hourly_rate: null,
    logged_hours: 0,
    currency: null,
    project_roles: roles,
  };
}

function sidebar(overrides: Partial<ProjectSidebar> = {}): ProjectSidebar {
  return {
    summary: null,
    details: {
      company: null,
      project_name: "P",
      phase: null,
      status: "Open",
      customer: null,
    },
    links: {
      slack: null,
      google_drive: null,
      website: null,
      github: null,
      opportunity: null,
    },
    burn: {
      total_budget: 0,
      cost_accrued: 0,
      cost_forecasted: 0,
      target_cost: 0,
    },
    progress: { actual_time: 0, total_hours_purchased: 40 },
    members: [
      member("pm", ["Project Manager"]),
      member("em", ["Engineering Manager"]),
      member("both", ["Project Manager", "Engineering Manager"]),
      member("dev"),
    ],
    customers: [],
    billing_team: [
      { name: "Biller", employee_id: "EMP-bill", user_id: "bill" },
    ],
    is_shared_with_everyone: false,
    ...overrides,
  };
}

describe("toMembers and splitMembers", () => {
  it("separates the managers from the team", () => {
    const { projectManager, engineeringManager, team } = splitMembers(
      toMembers(sidebar()),
    );
    expect(projectManager?.userId).toBe("pm");
    expect(engineeringManager?.userId).toBe("em");
    expect(team.map((m) => m.userId)).toEqual(["dev"]);
  });

  it("prefers the company email and carries the hours bought", () => {
    const data = sidebar({
      members: [{ ...member("dev"), company_email: "dev@company.test" }],
    });
    const [dev] = toMembers(data);
    expect(dev.email).toBe("dev@company.test");
    expect(dev.totalHoursPurchased).toBe(40);
  });
});

describe("removeBlockedReason", () => {
  it.each([
    ["pm", "Pick someone else as Project Manager first"],
    ["both", "Pick someone else as Project Manager and Lead Engineer first"],
    ["bill", "Delete their rate in Project rates on the Tracking tab first"],
    ["dev", undefined],
  ])("for %s", (userId, reason) => {
    expect(removeBlockedReason(sidebar(), userId)).toBe(reason);
  });
});

describe("planManagerChange", () => {
  const project = {
    custom_project_manager: "pm",
    custom_engineering_manager: "em",
  };

  it("shares with a new manager and unshares the previous one", () => {
    expect(
      planManagerChange("project_manager", "new", project, ["pm", "em"]),
    ).toEqual({
      field: "custom_project_manager",
      shareWith: "new",
      unshareFrom: "pm",
    });
  });

  it("doesn't share with someone who's already a member", () => {
    expect(
      planManagerChange("project_manager", "dev", project, ["dev"]).shareWith,
    ).toBeUndefined();
  });

  it("keeps the previous manager when they're the other manager", () => {
    expect(
      planManagerChange(
        "engineering_manager",
        "dev",
        { custom_project_manager: "x", custom_engineering_manager: "x" },
        [],
      ).unshareFrom,
    ).toBeUndefined();
  });

  it("clears the field without sharing", () => {
    expect(planManagerChange("engineering_manager", null, project, [])).toEqual(
      {
        field: "custom_engineering_manager",
        shareWith: undefined,
        unshareFrom: "em",
      },
    );
  });
});

describe("managerOptions", () => {
  it("keeps employees with a user, keyed by user, and the current manager", () => {
    const [current] = toMembers(sidebar({ members: [member("pm")] }));
    const options = managerOptions(
      [
        { label: "A", value: "EMP-a", userId: "a" },
        { label: "No user", value: "EMP-b" },
      ],
      current,
    );
    expect(options.map((option) => option.value)).toEqual(["pm", "a"]);
  });
});

describe("hints and labels", () => {
  it.each([
    ["Fixed Cost", "No submitted Sales Order is linked to this project"],
    ["Non-Billable", "Estimated Cost is not set on this project"],
    [undefined, "Estimated Cost is not set on this project"],
  ])("budget hint for %s", (billingType, hint) => {
    expect(budgetNotSetHint(billingType)).toBe(hint);
  });

  it.each([
    ["Retainer", "Total Hours Purchased is not set on this project"],
    ["Fixed Cost", "Target Hours is not set on this project"],
  ])("target hint for %s", (billingType, hint) => {
    expect(targetNotSetHint(billingType)).toBe(hint);
  });

  it.each([
    [0, "0 hours"],
    [1, "1 hour"],
    [1.5, "1.5 hours"],
  ])("formats %s hours", (hours, label) => {
    expect(formatHoursLabel(hours)).toBe(label);
  });
});
