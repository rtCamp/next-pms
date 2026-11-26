import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins class values and drops falsy ones", () => {
    expect(
      cn("flex", false, null, undefined, [
        "gap-2",
        { "p-2": true, "m-2": false },
      ]),
    ).toBe("flex gap-2 p-2");
  });

  it("lets a later Tailwind class win over a conflicting earlier one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-ink-gray-5", "text-ink-gray-8")).toBe("text-ink-gray-8");
  });

  it("keeps a frappe-ui text style next to a text colour", () => {
    expect(cn("text-base-medium", "text-ink-gray-8")).toBe(
      "text-base-medium text-ink-gray-8",
    );
    expect(cn("text-p-sm", "text-ink-gray-5")).toBe(
      "text-p-sm text-ink-gray-5",
    );
  });

  it("treats frappe-ui text styles as font sizes", () => {
    expect(cn("text-sm", "text-base-medium")).toBe("text-base-medium");
  });

  it("merges frappe-ui's numbered radius and base shadow", () => {
    expect(cn("rounded-2", "rounded-4")).toBe("rounded-4");
    expect(cn("shadow-sm", "shadow-base")).toBe("shadow-base");
  });
});
