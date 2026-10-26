import { beforeEach, describe, expect, it } from "vitest";
import { seedColorScheme } from "./theme";

describe("seedColorScheme", () => {
  beforeEach(() => {
    localStorage.removeItem("theme");
    localStorage.removeItem("next-pms-ui-theme");
  });

  it("keeps a saved scheme", () => {
    localStorage.setItem("theme", "dark");
    localStorage.setItem("next-pms-ui-theme", "light");
    seedColorScheme("Light");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("takes the React app's choice first", () => {
    localStorage.setItem("next-pms-ui-theme", "system");
    seedColorScheme("Dark");
    expect(localStorage.getItem("theme")).toBe("system");
  });

  it.each([
    ["Dark", "dark"],
    ["Light", "light"],
    ["Automatic", "system"],
  ])("falls back to the Desk theme %s", (deskTheme, scheme) => {
    seedColorScheme(deskTheme);
    expect(localStorage.getItem("theme")).toBe(scheme);
  });

  it("replaces an unknown saved value", () => {
    localStorage.setItem("theme", "sepia");
    seedColorScheme("Dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("saves nothing without a choice or a Desk theme", () => {
    localStorage.setItem("next-pms-ui-theme", "sepia");
    seedColorScheme();
    expect(localStorage.getItem("theme")).toBeNull();
  });
});
