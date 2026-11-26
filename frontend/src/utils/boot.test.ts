import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { canCreate, hasProjectField } from "./boot";

describe("hasProjectField", () => {
  let saved: Boot | undefined;
  beforeEach(() => {
    saved = window.boot;
  });
  afterEach(() => {
    window.boot = saved;
  });

  it("is true for a field the site has", () => {
    window.boot = {
      sitename: "test",
      optional_project_fields: { custom_source: true, custom_territory: false },
    };
    expect(hasProjectField("custom_source")).toBe(true);
  });

  it("is false for a field the site lacks or doesn't list", () => {
    window.boot = {
      sitename: "test",
      optional_project_fields: { custom_territory: false },
    };
    expect(hasProjectField("custom_territory")).toBe(false);
    expect(hasProjectField("custom_source")).toBe(false);
  });

  it("is false without boot data or the map", () => {
    window.boot = { sitename: "test" };
    expect(hasProjectField("custom_source")).toBe(false);
    window.boot = undefined;
    expect(hasProjectField("custom_source")).toBe(false);
  });
});

describe("canCreate", () => {
  let saved: Boot | undefined;
  beforeEach(() => {
    saved = window.boot;
  });
  afterEach(() => {
    window.boot = saved;
  });

  it("reads the user's creatable doctypes", () => {
    window.boot = {
      sitename: "test",
      user: { name: "me@example.com", can_create: ["Risk"] },
    };
    expect(canCreate("Risk")).toBe(true);
    expect(canCreate("Project")).toBe(false);
  });

  it("is true without the list", () => {
    window.boot = { sitename: "test", user: { name: "me@example.com" } };
    expect(canCreate("Risk")).toBe(true);
    window.boot = undefined;
    expect(canCreate("Risk")).toBe(true);
  });
});
