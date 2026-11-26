import { dayjs } from "frappe-ui";
import type { FilterCondition } from "@/components/Filter";
import {
  isCompleteFilterCondition,
  isNoValueOperator,
  normalizeLikeFilterValue,
} from "@/utils/filters";

/** Field name of the date-range condition, which picks the weeks instead of filtering. */
export const DATE_FILTER_FIELD = "date";

/** What the timesheet endpoints get for the filter conditions. */
export interface TimesheetQuery {
  /** Date the weeks are fetched back from: the range's end, else today (`YYYY-MM-DD`). */
  weekDate: string;
  /** Weeks per request: the weeks the range spans, else the page's default. */
  maxWeek: number;
  /** Whether a date range picks the weeks, so there are no more pages to load. */
  dateBounded: boolean;
  /** `[[fieldCategory, field, operator, value]]` for the conditions with a category. */
  filters: unknown[][];
}

/**
 * The conditions that carry a `fieldCategory` as `[[fieldCategory, field, operator,
 * value]]`, with `like` values wrapped in `%`. Incomplete conditions are left out.
 */
export function buildCategoryFilters(conditions: FilterCondition[]) {
  return conditions
    .filter(
      (condition) =>
        condition.fieldCategory && isCompleteFilterCondition(condition),
    )
    .map((condition) => [
      condition.fieldCategory,
      condition.field,
      condition.operator,
      isNoValueOperator(condition.operator)
        ? null
        : normalizeLikeFilterValue(condition.operator, condition.value),
    ]);
}

/** ISO week-numbering year and week of a `YYYY-MM-DD` date. */
function isoWeek(isoDate: string): { year: number; week: number } {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // The ISO week belongs to the year that holds its Thursday.
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const weekYear = date.getUTCFullYear();
  const dayOfYear = (date.getTime() - Date.UTC(weekYear, 0, 1)) / 86_400_000;
  return { year: weekYear, week: Math.floor(dayOfYear / 7) + 1 };
}

/** ISO weeks in an ISO week-numbering year (52 or 53). */
function isoWeeksInYear(year: number): number {
  return isoWeek(`${year}-12-28`).week;
}

/**
 * Calendar weeks a date range touches, counting both ends; Sunday to Monday is two.
 * Across years the weeks between are counted as 52 each, as the React page does.
 */
export function countIsoWeeks(from: string, to: string): number {
  const start = isoWeek(from);
  const end = isoWeek(to);
  if (start.year === end.year) return Math.max(end.week - start.week + 1, 1);
  return Math.max(
    isoWeeksInYear(start.year) -
      start.week +
      1 +
      end.week +
      (end.year - start.year - 1) * 52,
    1,
  );
}

/**
 * Turns the Filter conditions into the endpoints' arguments. A `date` range sets the
 * weeks: fetched back from its end date, as many as it spans, with no further pages.
 */
export function buildTimesheetQuery(
  conditions: FilterCondition[],
  weeksPerPage: number,
): TimesheetQuery {
  const complete = conditions.filter(isCompleteFilterCondition);
  const range = complete.find(
    (condition) => condition.field === DATE_FILTER_FIELD,
  )?.value;
  const [from, to] = Array.isArray(range) ? range : [];
  const dateBounded = Boolean(from && to);
  return {
    weekDate: dateBounded ? to : dayjs().format("YYYY-MM-DD"),
    maxWeek: dateBounded ? countIsoWeeks(from, to) : weeksPerPage,
    dateBounded,
    filters: buildCategoryFilters(complete),
  };
}
