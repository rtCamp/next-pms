import { dayjs } from "frappe-ui";

function plural(count: number, unit: string) {
  return count === 1 ? `1 ${unit} ago` : `${count} ${unit}s ago`;
}

/**
 * Formats a date as a relative time from `now`: `"now"`, then minutes, hours,
 * days, weeks (under 30 days), months (under a year) and years.
 *
 * @param value - The date to format: an ISO / Frappe datetime string or a `Date`.
 * @param now - The reference time. Defaults to the current time.
 * @param long - `true` for full words (`"1 week ago"`), `false` for the short
 *   form (`"1w ago"`).
 * @returns The relative time, e.g. `"3h ago"` or `"3 hours ago"`. Future dates
 *   return `"now"`.
 */
export function formatRelativeTimeShort(
  value: string | Date,
  now: Date = new Date(),
  long = false,
): string {
  const date = dayjs(value);
  const ref = dayjs(now);
  const minutes = Math.max(ref.diff(date, "minute"), 0);

  if (minutes < 1) return "now";

  if (minutes < 60)
    return long ? plural(minutes, "minute") : `${minutes}min ago`;

  const hours = ref.diff(date, "hour");
  if (hours < 24) return long ? plural(hours, "hour") : `${hours}h ago`;

  const days = ref.diff(date, "day");
  if (days < 7) return long ? plural(days, "day") : `${days}d ago`;

  if (days < 30) {
    const weeks = ref.diff(date, "week");
    return long ? plural(weeks, "week") : `${weeks}w ago`;
  }

  if (days < 365) {
    const months = Math.max(ref.diff(date, "month"), 1);
    return long ? plural(months, "month") : `${months}m ago`;
  }

  const years = Math.max(ref.diff(date, "year"), 1);
  return long ? plural(years, "year") : `${years}y ago`;
}

/**
 * Strips HTML tags from a string and collapses whitespace, e.g. to check
 * whether rich-text editor output has any visible text.
 *
 * Not a sanitiser: the result must not be rendered as HTML.
 *
 * @param html - The HTML string.
 * @returns The text with tags replaced by spaces, `&nbsp;` decoded to a
 *   space, runs of whitespace collapsed and the ends trimmed.
 */
export function stripTags(html: string): string {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
