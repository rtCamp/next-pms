import { describe, expect, it } from "vitest";
import {
  canManageUpdate,
  ownerGatedPermissions,
  toEmployeeUserOptions,
  toPerson,
} from "./permissions";

const ME = "me@example.com";

describe("ownerGatedPermissions", () => {
  it.each([
    "System Manager",
    "Projects Manager",
    "Delivery Manager",
    "Delivery User",
    "Timesheet Manager",
  ])("lets %s edit and delete any record", (role) => {
    expect(ownerGatedPermissions([role], ME, "other@example.com")).toEqual({
      canEdit: true,
      canDelete: true,
    });
  });

  it("lets a Projects User edit only their own record, ignoring case", () => {
    expect(
      ownerGatedPermissions(["Projects User"], ME, "ME@example.com"),
    ).toEqual({ canEdit: true, canDelete: false });
    expect(
      ownerGatedPermissions(["Projects User"], ME, "other@example.com"),
    ).toEqual({ canEdit: false, canDelete: false });
    expect(ownerGatedPermissions(["Projects User"], ME, null)).toEqual({
      canEdit: false,
      canDelete: false,
    });
  });

  it("gives other roles nothing", () => {
    expect(ownerGatedPermissions(["Employee"], ME, ME)).toEqual({
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
