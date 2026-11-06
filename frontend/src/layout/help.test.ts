import { describe, expect, it } from "vitest";
import { ALLOCATION_DIALOG_TIPS } from "@/pages/allocations/shared/help";
import { PROJECT_DETAIL_TIPS } from "@/pages/project-details/help";
import { NOTE_EDITOR_ROUTES } from "@/pages/project-details/notes/constants";
import { TASKS_TIPS } from "@/pages/tasks/help";
import { tipsForRoute } from "./help";

describe("tipsForRoute", () => {
  it("returns the page's tips by route name", () => {
    expect(tipsForRoute("task", {})).toBe(TASKS_TIPS);
  });

  it("adds the allocation dialog's tips to both allocation pages", () => {
    for (const name of ["allocations-team", "allocations-project"]) {
      const ids = tipsForRoute(name, {}).map((tip) => tip.id);
      expect(ids).toContain(ALLOCATION_DIALOG_TIPS[0].id);
    }
  });

  it("returns the open tab's tips on a project, Overview by default", () => {
    expect(tipsForRoute("project-details", {})).toBe(
      PROJECT_DETAIL_TIPS.overview,
    );
    expect(tipsForRoute("project-details", { tab: "risks" })).toBe(
      PROJECT_DETAIL_TIPS.risks,
    );
    expect(tipsForRoute("project-details", { tab: ["growth", "notes"] })).toBe(
      PROJECT_DETAIL_TIPS.growth,
    );
  });

  it("returns no tips for an unknown tab, a page without tips or a nameless route", () => {
    expect(tipsForRoute("project-details", { tab: "nope" })).toEqual([]);
    expect(tipsForRoute("not-found", {})).toEqual([]);
    expect(tipsForRoute(NOTE_EDITOR_ROUTES.new, {})).toEqual([]);
    expect(tipsForRoute(undefined, {})).toEqual([]);
  });
});
