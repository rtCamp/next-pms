import { beforeEach, describe, expect, it } from "vitest";
import { applyStartingColorScheme, rememberColorScheme } from "./theme";

describe("applyStartingColorScheme", () => {
  beforeEach(() => {
    localStorage.removeItem("theme");
    localStorage.removeItem("next-pms-ui-theme");
  });

  it("takes the user's pick over the Desk theme", () => {
    localStorage.setItem("next-pms-ui-theme", "system");
    applyStartingColorScheme("Dark");
    expect(localStorage.getItem("theme")).toBe("system");
  });

  it.each([
    ["Dark", "dark"],
    ["Light", "light"],
    ["Automatic", "system"],
  ])("falls back to the Desk theme %s", (deskTheme, scheme) => {
    applyStartingColorScheme(deskTheme);
    expect(localStorage.getItem("theme")).toBe(scheme);
  });

  it("follows a changed Desk theme while the user hasn't picked one", () => {
    applyStartingColorScheme("Light");
    applyStartingColorScheme("Dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("keeps a remembered pick after the Desk theme changes", () => {
    applyStartingColorScheme("Dark");
    rememberColorScheme("light");
    applyStartingColorScheme("Dark");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("changes nothing without a pick or a Desk theme", () => {
    localStorage.setItem("theme", "dark");
    localStorage.setItem("next-pms-ui-theme", "sepia");
    applyStartingColorScheme();
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});
