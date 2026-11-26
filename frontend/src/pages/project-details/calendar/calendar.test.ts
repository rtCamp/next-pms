import { describe, expect, it } from "vitest";
import {
  calendarView,
  calendarWeeks,
  dateKey,
  deleteItemMessage,
  emptyTableMessage,
  filterByType,
  floatingLabel,
  ganttItems,
  ganttPosition,
  isFloatingChip,
  isFollowing,
  isOverdue,
  itemForm,
  itemPayload,
  itemsByDate,
  listItems,
  mapTimelineItem,
  monthItems,
  monthTimeline,
  monthWindow,
  tableTab,
  toLinkedRecord,
  validateItemForm,
} from "./calendar";
import type { ApiTimelineItem, TimelineItem } from "./types";

const api = (overrides: Partial<ApiTimelineItem> = {}): ApiTimelineItem => ({
  name: "PTI-1",
  title: "Launch",
  project: "PROJ-1",
  type: "Milestone",
  category: "Delivery - Milestone",
  category_label: "Delivery",
  is_complete: 0,
  is_internal: 1,
  start_date: "2026-10-05",
  planned_end_date: "2026-10-09",
  actual_end_date: null,
  owner: { user: "a@example.com", full_name: "Ann", image: null },
  watchers: [{ user: "b@example.com", full_name: "Bob", image: "/b.png" }],
  ...overrides,
});

const item = (overrides: Partial<TimelineItem> = {}): TimelineItem => ({
  ...mapTimelineItem(api()),
  ...overrides,
});

// October 2026 starts on a Thursday: its weeks run from Mon 28 Sep to Sun 1 Nov.
const october = new Date(2026, 9, 15);

describe("calendarView and tableTab", () => {
  it("reads the URL values, defaulting to the calendar and milestones", () => {
    expect(calendarView("gantt")).toBe("gantt");
    expect(calendarView("list")).toBe("list");
    expect(calendarView("")).toBe("calendar");
    expect(calendarView("board")).toBe("calendar");
    expect(tableTab("touchpoints")).toBe("touchpoints");
    expect(tableTab("other")).toBe("milestones");
  });
});

describe("mapTimelineItem, monthItems and listItems", () => {
  it("maps the API item", () => {
    expect(mapTimelineItem(api())).toEqual({
      name: "PTI-1",
      title: "Launch",
      project: "PROJ-1",
      type: "Milestone",
      category: "Delivery - Milestone",
      categoryLabel: "Delivery",
      isComplete: false,
      isInternal: true,
      startDate: "2026-10-05",
      plannedEndDate: "2026-10-09",
      actualEndDate: undefined,
      owner: { userId: "a@example.com", fullName: "Ann", image: undefined },
      watchers: [{ userId: "b@example.com", fullName: "Bob", image: "/b.png" }],
    });
    expect(mapTimelineItem(api({ owner: null })).owner).toEqual({
      userId: "",
      fullName: "",
    });
  });

  it("drops items without dates as React does", () => {
    const rows = [
      api(),
      api({ name: "PTI-2", start_date: null }),
      api({ name: "PTI-3", planned_end_date: null }),
    ];
    expect(monthItems(rows).map((row) => row.name)).toEqual(["PTI-1"]);
    expect(listItems(rows).map((row) => row.name)).toEqual(["PTI-1", "PTI-2"]);
  });
});

describe("month window and weeks", () => {
  it("fetches from the Monday of the 1st's week to the Sunday of the last day's", () => {
    expect(monthWindow(october)).toEqual({
      startDate: "2026-09-28",
      endDate: "2026-11-01",
    });
    // February 2027 starts on a Monday and ends on a Sunday.
    expect(monthWindow(new Date(2027, 1, 10))).toEqual({
      startDate: "2027-02-01",
      endDate: "2027-02-28",
    });
  });

  it("lays the month out in Monday-first weeks", () => {
    const weeks = calendarWeeks(october);
    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(dateKey(weeks[0][0])).toBe("2026-09-28");
    expect(dateKey(weeks[4][6])).toBe("2026-11-01");
    expect(calendarWeeks(new Date(2027, 1, 1))).toHaveLength(4);
  });
});

describe("itemsByDate and filterByType", () => {
  it("puts a milestone on its start and a touchpoint on its date", () => {
    const milestone = item();
    const touchpoint = item({
      name: "PTI-2",
      type: "Touchpoint",
      startDate: "2026-10-12",
      plannedEndDate: "2026-10-12",
    });
    const late = item({ name: "PTI-3", startDate: undefined });
    const byDate = itemsByDate([milestone, touchpoint, late]);
    expect(byDate.get("2026-10-05")).toEqual([milestone]);
    expect(byDate.get("2026-10-12")).toEqual([touchpoint]);
    expect(byDate.get("2026-10-09")).toEqual([late]);
  });

  it("filters by type", () => {
    const touchpoint = item({ name: "PTI-2", type: "Touchpoint" });
    const items = [item(), touchpoint];
    expect(filterByType(items, "all")).toHaveLength(2);
    expect(filterByType(items, "touchpoints")).toEqual([touchpoint]);
    expect(filterByType(items, "milestones")).toEqual([items[0]]);
  });
});

describe("Gantt layout", () => {
  const timeline = monthTimeline(october, new Date(2026, 9, 20));
  const totalWidth = timeline.columnCount * 38;

  it("spans the month's weeks", () => {
    expect(timeline.columnCount).toBe(35);
    expect(dateKey(timeline.weekStart)).toBe("2026-09-28");
    expect(timeline.weeks[0].label).toBe("Sep 28 - Oct 4");
    expect(
      timeline.weeks
        .flatMap((week) => week.days)
        .find((day) => day.isToday)
        ?.date.getDate(),
    ).toBe(20);
  });

  it("places a bar from start to planned end", () => {
    // 5 Oct is column 7, 9 Oct column 11.
    expect(ganttPosition(item(), timeline)).toEqual({
      left: 7 * 38,
      width: 5 * 38,
    });
  });

  it("clips a bar to the columns", () => {
    expect(
      ganttPosition(
        item({ startDate: "2026-09-01", plannedEndDate: "2026-12-01" }),
        timeline,
      ),
    ).toEqual({ left: 0, width: totalWidth });
  });

  it("draws an item without a start as one column at its date", () => {
    expect(ganttPosition(item({ startDate: undefined }), timeline)).toEqual({
      left: 11 * 38,
      width: 38,
    });
  });

  it("leaves out items outside the weeks", () => {
    expect(
      ganttPosition(
        item({ startDate: "2026-11-02", plannedEndDate: "2026-11-05" }),
        timeline,
      ),
    ).toBeNull();
    expect(
      ganttPosition(
        item({ startDate: "2026-09-01", plannedEndDate: "2026-09-27" }),
        timeline,
      ),
    ).toBeNull();
  });

  it("lists the items in view by start", () => {
    const later = item({ name: "PTI-2", startDate: "2026-10-20" });
    const earlier = item({
      name: "PTI-3",
      startDate: undefined,
      plannedEndDate: "2026-10-02",
    });
    const outside = item({
      name: "PTI-4",
      startDate: "2026-12-01",
      plannedEndDate: "2026-12-02",
    });
    expect(
      ganttItems([later, item(), outside, earlier], timeline).map(
        (row) => row.name,
      ),
    ).toEqual(["PTI-3", "PTI-1", "PTI-2"]);
  });

  it("floats touchpoints and one-day milestones as chips", () => {
    const position = { left: 0, width: 38 };
    expect(isFloatingChip(item(), { left: 0, width: 76 })).toBe(false);
    expect(isFloatingChip(item(), position)).toBe(true);
    expect(
      isFloatingChip(item({ type: "Touchpoint" }), { left: 0, width: 76 }),
    ).toBe(true);
  });

  it("flips a floating label left near the right edge", () => {
    expect(floatingLabel({ left: 100, width: 38 }, totalWidth)).toEqual({
      flip: false,
      left: 100,
    });
    const near = { left: totalWidth - 38 - 149, width: 38 };
    expect(floatingLabel(near, totalWidth)).toEqual({ flip: true, right: 149 });
  });
});

describe("item state", () => {
  const today = new Date(2026, 9, 10);

  it("is overdue once its planned date has passed, unless complete", () => {
    expect(isOverdue(item(), today)).toBe(true);
    expect(isOverdue(item({ plannedEndDate: "2026-10-10" }), today)).toBe(
      false,
    );
    expect(isOverdue(item({ isComplete: true }), today)).toBe(false);
  });

  it("knows who follows it", () => {
    expect(isFollowing(item(), "b@example.com")).toBe(true);
    expect(isFollowing(item(), "a@example.com")).toBe(false);
    expect(isFollowing(item(), "")).toBe(false);
  });

  it("says linked ToDos stay when it is deleted", () => {
    expect(deleteItemMessage(item(), false)).toBe(
      'Are you sure you want to delete the milestone "Launch"? This action cannot be undone.',
    );
    expect(deleteItemMessage(item({ type: "Touchpoint" }), true)).toBe(
      'Are you sure you want to delete the touchpoint "Launch"? Its linked ToDos will not be deleted. This action cannot be undone.',
    );
  });

  it("becomes a linked record", () => {
    expect(toLinkedRecord(item())).toEqual({
      doctype: "Project Timeline Item",
      name: "PTI-1",
      title: "Launch",
      type: "Milestone",
    });
  });

  it("names the empty table", () => {
    expect(emptyTableMessage("milestones")).toBe("No milestones yet");
    expect(emptyTableMessage("touchpoints", "call")).toBe(
      "No touchpoints found",
    );
  });
});

describe("item form", () => {
  const today = new Date(2026, 9, 10);

  it("starts a new item today with the fallback category", () => {
    expect(itemForm("Touchpoint", null, today)).toEqual({
      title: "",
      category: "Other - Touchpoint",
      startDate: "2026-10-10",
      plannedEndDate: "2026-10-10",
      owner: "",
      isInternal: false,
    });
  });

  it("fills in the item's values", () => {
    expect(itemForm("Milestone", item(), today)).toEqual({
      title: "Launch",
      category: "Delivery - Milestone",
      startDate: "2026-10-05",
      plannedEndDate: "2026-10-09",
      owner: "a@example.com",
      isInternal: true,
    });
  });

  it("checks React's rules", () => {
    const empty = {
      title: " ",
      category: "",
      startDate: "",
      plannedEndDate: "",
      owner: "",
      isInternal: false,
    };
    expect(validateItemForm("Milestone", empty)).toEqual({
      title: "Please enter a milestone name.",
      category: "Please select a type.",
      startDate: "Please select a start date.",
      plannedEndDate: "Please select a completion date.",
      owner: "Please select an owner.",
    });
    expect(validateItemForm("Touchpoint", empty)).toMatchObject({
      title: "Please enter a touchpoint name.",
      plannedEndDate: "Please select a scheduled date.",
    });
    expect(
      validateItemForm("Milestone", {
        ...itemForm("Milestone", item(), today),
        startDate: "2026-10-12",
      }),
    ).toEqual({
      plannedEndDate: "Completion date must be on or after start date.",
    });
  });

  it("sends a start date for milestones only", () => {
    const form = itemForm("Milestone", item(), today);
    expect(itemPayload("Milestone", form)).toEqual({
      title: "Launch",
      item_owner: "a@example.com",
      category: "Delivery - Milestone",
      is_internal: 1,
      start_date: "2026-10-05",
      planned_end_date: "2026-10-09",
    });
    expect(itemPayload("Touchpoint", form)).not.toHaveProperty("start_date");
  });
});
