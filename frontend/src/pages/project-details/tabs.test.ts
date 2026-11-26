import { describe, expect, it } from "vitest";
import { PROJECT_TABS } from "./constants";
import { selectedTab, visibleTabs } from "./tabs";

const all = {
  showRagStats: true,
  reportsEnabled: true,
};
const values = (flags: typeof all) =>
  visibleTabs(flags).map((tab) => tab.value);

describe("visibleTabs", () => {
  it("shows every tab, in order, when all are enabled", () => {
    expect(visibleTabs(all)).toEqual([...PROJECT_TABS]);
  });

  it("hides each conditional tab on its own flag", () => {
    expect(values({ ...all, showRagStats: false })).not.toContain("rag-stats");
    expect(values({ ...all, reportsEnabled: false })).not.toContain("reports");
    expect(
      values({
        showRagStats: false,
        reportsEnabled: false,
      }),
    ).toEqual([
      "overview",
      "calendar",
      "tracking",
      "risks",
      "growth",
      "notes",
      "email",
      "to-do",
      "feedback",
    ]);
  });
});

describe("selectedTab", () => {
  const tabs = visibleTabs({ ...all, reportsEnabled: false });

  it("selects a visible tab", () => {
    expect(selectedTab("tracking", tabs)).toBe("tracking");
  });

  it.each(["", "bogus", "reports"])(
    "falls back to Overview for %j",
    (param) => {
      expect(selectedTab(param, tabs)).toBe("overview");
    },
  );
});
