import { describe, expect, it } from "vitest";
import {
  EMPLOYEE_CAPABILITIES,
  PMS_LEADERSHIP_CAPABILITIES,
  PROJECTS_MANAGER_CAPABILITIES,
  PROJECTS_USER_CAPABILITIES,
} from "@/session/capabilities.fixtures";
import {
  canManageUpdate,
  ownerGatedPermissions,
  riskPermissions,
  toEmployeeUserOptions,
  toPerson,
} from "./permissions";

const ME = "me@example.com";

describe("ownerGatedPermissions", () => {
  it.each([
    ["Projects Manager", PROJECTS_MANAGER_CAPABILITIES],
    ["PMS Leadership", PMS_LEADERSHIP_CAPABILITIES],
  ])("lets %s edit and delete any record", (_, capabilities) => {
    expect(
      ownerGatedPermissions(capabilities, ME, "other@example.com"),
    ).toEqual({ canEdit: true, canDelete: true });
  });

  it("lets a Projects User edit only their own record, ignoring case", () => {
    const capabilities = PROJECTS_USER_CAPABILITIES;
    expect(ownerGatedPermissions(capabilities, ME, "ME@example.com")).toEqual({
      canEdit: true,
      canDelete: false,
    });
    expect(
      ownerGatedPermissions(capabilities, ME, "other@example.com"),
    ).toEqual({ canEdit: false, canDelete: false });
    expect(ownerGatedPermissions(capabilities, ME, null)).toEqual({
      canEdit: false,
      canDelete: false,
    });
  });

  it("gives an employee nothing", () => {
    expect(ownerGatedPermissions(EMPLOYEE_CAPABILITIES, ME, ME)).toEqual({
      canEdit: false,
      canDelete: false,
    });
  });
});

describe("riskPermissions", () => {
  it("lets Projects page users edit any risk and project admins delete it", () => {
    expect(riskPermissions(PROJECTS_USER_CAPABILITIES)).toEqual({
      canEdit: true,
      canDelete: false,
    });
    expect(riskPermissions(PROJECTS_MANAGER_CAPABILITIES)).toEqual({
      canEdit: true,
      canDelete: true,
    });
    expect(riskPermissions(EMPLOYEE_CAPABILITIES)).toEqual({
      canEdit: false,
      canDelete: false,
    });
  });
});

describe("canManageUpdate", () => {
  it("lets the author manage their update on a record they may edit", () => {
    expect(canManageUpdate(true, ["Projects User"], ME, ME)).toBe(true);
    expect(
      canManageUpdate(true, ["Projects Manager"], ME, "x@example.com"),
    ).toBe(false);
    expect(canManageUpdate(false, ["Projects User"], ME, ME)).toBe(false);
  });

  it("lets a System Manager manage anyone's update", () => {
    expect(canManageUpdate(true, ["System Manager"], ME, "x@example.com")).toBe(
      true,
    );
  });
});

describe("toPerson", () => {
  it("uses the full name and image, else the user ID", () => {
    expect(
      toPerson(ME, { name: ME, full_name: "Me", user_image: "/me.png" }),
    ).toEqual({ userId: ME, label: "Me", image: "/me.png" });
    expect(toPerson(ME)).toEqual({ userId: ME, label: ME, image: undefined });
  });
});

describe("toEmployeeUserOptions", () => {
  const options = [
    {
      label: "Ann",
      value: "EMP-1",
      userId: "ann@example.com",
      image: "/a.png",
    },
    { label: "No user", value: "EMP-2" },
  ];

  it("keys options by user and drops employees without one", () => {
    expect(toEmployeeUserOptions(options)).toEqual([
      {
        label: "Ann",
        value: "ann@example.com",
        userId: "ann@example.com",
        image: "/a.png",
      },
    ]);
  });

  it("keeps the current user first when the results lack them", () => {
    const current = { userId: ME, label: "Me" };
    expect(toEmployeeUserOptions(options, current)[0]).toEqual({
      label: "Me",
      value: ME,
      userId: ME,
      image: undefined,
    });
    expect(
      toEmployeeUserOptions(options, {
        userId: "ann@example.com",
        label: "Ann",
      }),
    ).toHaveLength(1);
  });
});
