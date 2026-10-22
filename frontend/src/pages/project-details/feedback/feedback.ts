import { dayjs } from "frappe-ui";
import {
  DEFAULT_VIEW,
  FEEDBACK_VIEWS,
  TIMELINE_SPAN_MONTHS,
  type FeedbackView,
} from "./constants";
import type {
  MonthKey,
  TimelineEntry,
  TimelineMonth,
  TimelineWindow,
} from "./types";

/** The view a `?view=` value selects; anything unknown is the client view. */
export function feedbackView(param: string): FeedbackView {
  return (
    FEEDBACK_VIEWS.find((view) => view.value === param)?.value ?? DEFAULT_VIEW
  );
}

export function monthKey({ year, month }: MonthKey): string {
  return dayjs(new Date(year, month)).format("YYYY-MM");
}

/** The current month and `TIMELINE_SPAN_MONTHS` either side of it, as React's ±5 years. */
export function initialWindow(today: Date): TimelineWindow {
  const month = dayjs(today).startOf("month");
  return {
    start: month.subtract(TIMELINE_SPAN_MONTHS, "month").format("YYYY-MM"),
    end: month.add(TIMELINE_SPAN_MONTHS, "month").format("YYYY-MM"),
  };
}

/** The window moved by `months`, later when positive. */
export function shiftWindow(
  window: TimelineWindow,
  months: number,
): TimelineWindow {
  return {
    start: dayjs(`${window.start}-01`).add(months, "month").format("YYYY-MM"),
    end: dayjs(`${window.end}-01`).add(months, "month").format("YYYY-MM"),
  };
}

/** The window as the timeline endpoint's `from_date` / `to_date`: first to last day. */
export function windowParams(window: TimelineWindow) {
  return {
    from_date: `${window.start}-01`,
    to_date: dayjs(`${window.end}-01`).endOf("month").format("YYYY-MM-DD"),
  };
}

/**
 * Every month of the window with its score. A month with several schedules shows
 * the first one that has feedback, else the first one (React showed the first).
 */
export function timelineMonths(
  window: TimelineWindow,
  entries: readonly TimelineEntry[],
): TimelineMonth[] {
  const byMonth = new Map<string, TimelineEntry>();
  for (const entry of entries) {
    const key = monthKey({ year: entry.year, month: entry.month - 1 });
    const current = byMonth.get(key);
    if (!current || (!current.feedback_id && entry.feedback_id)) {
      byMonth.set(key, entry);
    }
  }
  const months: TimelineMonth[] = [];
  const end = dayjs(`${window.end}-01`);
  for (
    let date = dayjs(`${window.start}-01`);
    !date.isAfter(end);
    date = date.add(1, "month")
  ) {
    const key = date.format("YYYY-MM");
    const entry = byMonth.get(key);
    months.push({
      key,
      year: date.year(),
      month: date.month(),
      score: entry?.score ?? null,
      feedbackId: entry?.feedback_id ?? null,
    });
  }
  return months;
}

/** The feedback of `month` in `entries`, picked as `timelineMonths` does. */
export function monthFeedbackId(
  month: MonthKey,
  entries: readonly TimelineEntry[],
): string | null {
  const matching = entries.filter(
    (entry) => entry.year === month.year && entry.month - 1 === month.month,
  );
  return (
    (matching.find((entry) => entry.feedback_id) ?? matching[0])?.feedback_id ??
    null
  );
}

/** The score's text colour on a month pill. */
export function scoreClass(score: number | null, selected: boolean): string {
  if (selected) return "text-ink-base";
  if (score === null) return "text-ink-gray-4";
  if (score >= 80) return "text-ink-gray-6";
  if (score >= 60) return "text-ink-amber-7";
  return "text-ink-red-7";
}

/** A 0–1 rating on a `max`-star scale. */
export function toStars(value: number | null, max: number): number {
  return (value ?? 0) * max;
}

/** A feedback period date as `"Sep 1"`. */
export function formatPeriodDate(date: string): string {
  return dayjs(date).format("MMM D");
}
