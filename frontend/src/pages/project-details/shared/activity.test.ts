import { describe, expect, it } from "vitest";
import { activityKey, activityName, tableChangeText } from "./activity";

describe("activityName", () => {
  const users = { "ann@example.com": { full_name: "Ann", user_image: null } };

  it("calls the viewer You and others by name", () => {
    expect(activityName("me@example.com", "me@example.com", users)).toBe("You");
    expect(activityName("ann@example.com", "me@example.com", users)).toBe(
      "Ann",
    );
    expect(activityName("bob@example.com", "me@example.com", users)).toBe(
      "bob@example.com",
    );
  });
});

describe("tableChangeText", () => {
  it("lists the non-zero counts", () => {
    expect(
      tableChangeText({
        label: "Update Log",
        added: 1,
        removed: 0,
        changed: 2,
      }),
    ).toBe("added 1 row, changed 2 rows in Update Log");
  });
});

describe("activityKey", () => {
  it("tells apart items with the same type and time", () => {
    const item = { type: "edited" as const, user: "a", timestamp: "t" };
    expect(activityKey(item, 0)).not.toBe(activityKey(item, 1));
  });
});
