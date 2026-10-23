import { dayjs } from "frappe-ui";
import {
  buildTimeline,
  CELL_WIDTH,
  columnIndex,
  type Timeline,
} from "@/components/GanttGrid";
import type { LinkedRecord } from "@/pages/project-details/to-do/types";
import { getWeekStart } from "@/utils/date";
import {
  CALENDAR_VIEWS,
  DEFAULT_CATEGORY,
  DEFAULT_TABLE_TAB,
  DEFAULT_VIEW,
  FLOATING_LABEL_FLIP_PX,
  TABLE_TABS,
  TIMELINE_ITEM_DOCTYPE,
} from "./constants";
import type {
  ApiTimelineItem,
  ApiUserRef,
  CalendarView,
  GanttPosition,
  TableTab,
  TimelineItem,
  TimelineItemErrors,
  TimelineItemForm,
  TimelineItemType,
  TypeFilter,
  UserRef,
} from "./types";

const DATE = "YYYY-MM-DD";

/** The view a `?view=` value selects; anything else is the calendar grid. */
export function calendarView(param: string): CalendarView {
  return (
    CALENDAR_VIEWS.find((view) => view.value === param)?.value ?? DEFAULT_VIEW
  );
}

/** The table tab a `?type=` value selects; anything else is milestones. */
export function tableTab(param: string): TableTab {
  return (
    TABLE_TABS.find((tab) => tab.value === param)?.value ?? DEFAULT_TABLE_TAB
  );
}

function toUserRef(raw: ApiUserRef): UserRef {
  return {
    userId: raw.user,
    fullName: raw.full_name,
    image: raw.image ?? undefined,
  };
}

export function mapTimelineItem(raw: ApiTimelineItem): TimelineItem {
  return {
    name: raw.name,
    title: raw.title,
    project: raw.project,
    type: raw.type,
    category: raw.category ?? undefined,
    categoryLabel: raw.category_label ?? undefined,
    isComplete: Boolean(raw.is_complete),
    isInternal: Boolean(raw.is_internal),
    startDate: raw.start_date ?? undefined,
    plannedEndDate: raw.planned_end_date ?? "",
    actualEndDate: raw.actual_end_date ?? undefined,
    owner: raw.owner ? toUserRef(raw.owner) : { userId: "", fullName: "" },
    watchers: (raw.watchers ?? []).map(toUserRef),
  };
}

/** The month's items as React reads them: only those with a start and a planned end. */
export function monthItems(raw: ApiTimelineItem[]): TimelineItem[] {
  return raw
    .filter(
      (item) => item.start_date !== null && item.planned_end_date !== null,
    )
    .map(mapTimelineItem);
}

/** The List view's items: only those with a planned end. */
export function listItems(raw: ApiTimelineItem[]): TimelineItem[] {
  return raw
    .filter((item) => item.planned_end_date !== null)
    .map(mapTimelineItem);
}

/** First day of the month `date` is in, at local midnight. */
export function monthStart(date: Date): Date {
  return dayjs(date).startOf("month").toDate();
}

/**
 * The dates a month fetches: Monday of the week of the 1st to Sunday of the week of
 * the last day, as React sends them (the backend reads the end as exclusive).
 */
export function monthWindow(month: Date): {
  startDate: string;
  endDate: string;
} {
  const first = dayjs(month).startOf("month");
  const lastWeekStart = dayjs(getWeekStart(first.endOf("month").toDate()));
  return {
    startDate: dayjs(getWeekStart(first.toDate())).format(DATE),
    endDate: lastWeekStart.add(6, "day").format(DATE),
  };
}

/** Number of Monday-first weeks the month touches. */
export function monthWeekCount(month: Date): number {
  const first = dayjs(getWeekStart(monthStart(month)));
  const last = dayjs(getWeekStart(dayjs(month).endOf("month").toDate()));
  return last.diff(first, "day") / 7 + 1;
}

/** The month grid's weeks, Monday first, each of seven days. */
export function calendarWeeks(month: Date): Date[][] {
  const first = dayjs(getWeekStart(monthStart(month)));
  return Array.from({ length: monthWeekCount(month) }, (_, week) =>
    Array.from({ length: 7 }, (_, day) =>
      first.add(week * 7 + day, "day").toDate(),
    ),
  );
}

/** The day an item shows on in the month grid: a milestone's start, a touchpoint's date. */
export function itemDateKey(item: TimelineItem): string {
  return item.type === "Milestone"
    ? (item.startDate ?? item.plannedEndDate)
    : item.plannedEndDate;
}

export function itemsByDate(
  items: TimelineItem[],
): Map<string, TimelineItem[]> {
  const byDate = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const key = itemDateKey(item);
    byDate.set(key, [...(byDate.get(key) ?? []), item]);
  }
  return byDate;
}

export function dateKey(date: Date): string {
  return dayjs(date).format(DATE);
}

export function filterByType(
  items: TimelineItem[],
  filter: TypeFilter,
): TimelineItem[] {
  if (filter === "all") return items;
  const type: TimelineItemType =
    filter === "milestones" ? "Milestone" : "Touchpoint";
  return items.filter((item) => item.type === type);
}

/** The Gantt's day columns and week header for the month, weekends shown. */
export function monthTimeline(month: Date, today = new Date()): Timeline {
  return buildTimeline({
    startDate: monthStart(month),
    weekCount: monthWeekCount(month),
    showWeekend: true,
    today,
  });
}

function inView(item: TimelineItem, first: Date, last: Date) {
  if (!item.plannedEndDate) return false;
  const plannedEnd = dayjs(item.plannedEndDate);
  if (plannedEnd.isBefore(first, "day")) return false;
  return item.startDate
    ? !dayjs(item.startDate).isAfter(last, "day")
    : !plannedEnd.isAfter(last, "day");
}

/** The Gantt's rows: the items in view, by start (or planned date when there is none). */
export function ganttItems(
  items: TimelineItem[],
  timeline: Timeline,
): TimelineItem[] {
  const first = timeline.weekStart;
  const last = dayjs(first)
    .add(timeline.columnCount - 1, "day")
    .toDate();
  return items
    .filter((item) => inView(item, first, last))
    .sort((a, b) => {
      const dateA = a.startDate ?? a.plannedEndDate;
      const dateB = b.startDate ?? b.plannedEndDate;
      return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    });
}

/**
 * An item's bar: from its start to its planned end, clipped to the columns, or one
 * column at the planned date when it has no start. `null` when out of view.
 */
export function ganttPosition(
  item: TimelineItem,
  timeline: Timeline,
): GanttPosition | null {
  const first = timeline.weekStart;
  const lastIndex = timeline.columnCount - 1;
  const last = dayjs(first).add(lastIndex, "day").toDate();
  if (!inView(item, first, last)) return null;
  const column = (date: string) =>
    Math.min(
      Math.max(columnIndex(dayjs(date).toDate(), timeline.weekStart, true), 0),
      lastIndex,
    );
  const end = column(item.plannedEndDate);
  if (!item.startDate) return { left: end * CELL_WIDTH, width: CELL_WIDTH };
  const start = column(item.startDate);
  if (start > end) return null;
  return {
    left: start * CELL_WIDTH,
    width: (end - start + 1) * CELL_WIDTH,
  };
}

/** Touchpoints and one-day milestones draw as an icon chip with the label beside it. */
export function isFloatingChip(
  item: TimelineItem,
  position: GanttPosition,
): boolean {
  return item.type === "Touchpoint" || position.width <= CELL_WIDTH;
}

/**
 * Where a chip's floating label goes: right of the chip, or left of it when less
 * than 150px remain to the right edge. `right` is the distance from that edge.
 */
export function floatingLabel(
  position: GanttPosition,
  totalWidth: number,
): { flip: false; left: number } | { flip: true; right: number } {
  const spaceRight = totalWidth - (position.left + position.width);
  return spaceRight < FLOATING_LABEL_FLIP_PX
    ? { flip: true, right: spaceRight }
    : { flip: false, left: position.left };
}

/** As React, a planned date before today is overdue unless the item is complete. */
export function isOverdue(item: TimelineItem, today = new Date()): boolean {
  return (
    !item.isComplete &&
    Boolean(item.plannedEndDate) &&
    dayjs(item.plannedEndDate).isBefore(dayjs(today), "day")
  );
}

export function isFollowing(item: TimelineItem, userId: string): boolean {
  return (
    Boolean(userId) && item.watchers.some((user) => user.userId === userId)
  );
}

export function deleteItemMessage(
  item: TimelineItem,
  hasTodos: boolean,
): string {
  return `Are you sure you want to delete the ${item.type.toLowerCase()} "${item.title}"?${
    hasTodos ? " Its linked ToDos will not be deleted." : ""
  } This action cannot be undone.`;
}

export function toLinkedRecord(item: TimelineItem): LinkedRecord {
  return {
    doctype: TIMELINE_ITEM_DOCTYPE,
    name: item.name,
    title: item.title,
    type: item.type,
  };
}

/** "No milestones yet", or "No touchpoints found" for a search with no results. */
export function emptyTableMessage(tab: TableTab, search = ""): string {
  return `No ${tab} ${search ? "found" : "yet"}`;
}

export function emptyItemForm(
  today = new Date(),
): Omit<TimelineItemForm, "category"> {
  const date = dayjs(today).format(DATE);
  return {
    title: "",
    startDate: date,
    plannedEndDate: date,
    owner: "",
    isInternal: false,
  };
}

/** A new item's form, or the item's own values; missing dates default to today, as React. */
export function itemForm(
  type: TimelineItemType,
  item: TimelineItem | null,
  today = new Date(),
): TimelineItemForm {
  const empty = emptyItemForm(today);
  if (!item) return { ...empty, category: DEFAULT_CATEGORY[type] };
  return {
    title: item.title,
    category: item.category ?? DEFAULT_CATEGORY[type],
    startDate: item.startDate ?? empty.startDate,
    plannedEndDate: item.plannedEndDate || empty.plannedEndDate,
    owner: item.owner.userId,
    isInternal: item.isInternal,
  };
}

/** React's rules and messages for the milestone and touchpoint dialogs. */
export function validateItemForm(
  type: TimelineItemType,
  form: TimelineItemForm,
): TimelineItemErrors {
  const label = type.toLowerCase();
  const errors: TimelineItemErrors = {};
  if (!form.title.trim()) errors.title = `Please enter a ${label} name.`;
  if (!form.category.trim()) errors.category = "Please select a type.";
  if (type === "Milestone") {
    if (!form.startDate.trim())
      errors.startDate = "Please select a start date.";
    if (!form.plannedEndDate.trim()) {
      errors.plannedEndDate = "Please select a completion date.";
    } else if (form.startDate && form.startDate > form.plannedEndDate) {
      errors.plannedEndDate = "Completion date must be on or after start date.";
    }
  } else if (!form.plannedEndDate.trim()) {
    errors.plannedEndDate = "Please select a scheduled date.";
  }
  if (!form.owner.trim()) errors.owner = "Please select an owner.";
  return errors;
}

/**
 * The fields a create or edit sends. A touchpoint sends no start date, so an edit
 * keeps its old one, as React does.
 */
export function itemPayload(type: TimelineItemType, form: TimelineItemForm) {
  return {
    title: form.title,
    item_owner: form.owner,
    category: form.category,
    is_internal: form.isInternal ? 1 : 0,
    ...(type === "Milestone" ? { start_date: form.startDate } : {}),
    planned_end_date: form.plannedEndDate,
  };
}
