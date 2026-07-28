/**
 * External dependencies.
 */
import { type ClassValue, clsx } from "clsx";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  isToday,
  parseISO,
} from "date-fns";
import { twMerge } from "tailwind-merge";
/**
 * Internal dependencies.
 */
import { getUTCDateTime } from "./date";

export function mergeClassNames(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deBounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export const getBgCsssForToday = (date: string) => {
  return isToday(getUTCDateTime(date)) ? "bg-slate-100 dark:bg-muted/50" : "";
};

export function floatToTime(
  float: number,
  hourPadding: number = 1,
  minutePadding: number = 2,
) {
  const totalMinutes = Math.round(float * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const formattedHours = String(hours).padStart(hourPadding, "0");
  const formattedMinutes = String(minutes).padStart(minutePadding, "0");

  return `${formattedHours}:${formattedMinutes}`;
}

/**
 * Formats a given date value into a relative time string.
 * @param value - The date value to format
 * @param now - The current date and time (optional, defaults to now)
 * @param long - If true, uses full words ("1 week ago"); otherwise short ("1w ago")
 * @returns The formatted relative time string
 */
export function formatRelativeTimeShort(
  value: string | Date,
  now = new Date(),
  long = false,
) {
  const date = typeof value === "string" ? parseISO(value) : value;
  const minutes = Math.max(differenceInMinutes(now, date), 0);

  if (minutes < 1) {
    return "now";
  }

  if (minutes < 60) {
    if (long) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    return `${minutes}min ago`;
  }

  const hours = differenceInHours(now, date);
  if (hours < 24) {
    if (long) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    return `${hours}h ago`;
  }

  const days = differenceInDays(now, date);
  if (days < 7) {
    if (long) return days === 1 ? "1 day ago" : `${days} days ago`;
    return `${days}d ago`;
  }

  if (days < 30) {
    const weeks = differenceInWeeks(now, date);
    if (long) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    return `${weeks}w ago`;
  }

  if (days < 365) {
    const months = Math.max(differenceInMonths(now, date), 1);
    if (long) return months === 1 ? "1 month ago" : `${months} months ago`;
    return `${months}m ago`;
  }

  const years = Math.max(differenceInYears(now, date), 1);
  if (long) return years === 1 ? "1 year ago" : `${years} years ago`;
  return `${years}y ago`;
}

export function stripTags(html: string): string {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const preProcessLink = (input: string) => {
  const linkRegex = /\b((https?:\/\/|www\.)[^\s]+)\b/gi;

  const processText = (text: string) => {
    return text.replace(linkRegex, (url) => {
      const href = url.startsWith("http") ? url : `https://${url}`;
      return `<a
                href="${href}"
                class="text-blue-500 underline hover:text-blue-700"
                target="_blank"
                rel="noopener noreferrer">${url}</a>`;
    });
  };

  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/html");

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    const parent = node.parentNode as HTMLElement;
    if (parent && !parent.closest("a")) {
      const processed = processText(node.textContent || "");
      if (processed !== node.textContent) {
        const wrapper = document.createElement("span");
        wrapper.innerHTML = processed;
        parent.replaceChild(wrapper, node);
      }
    }
  });

  return doc.body.innerHTML;
};

/**
 * Converts time string in "HH:MM" format to decimal hours.
 * @param timeStr - Time string in "HH:MM" format (e.g., "8:30")
 * @returns Decimal hours (e.g., 8.5)
 */
export const timeToDecimalHours = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours + minutes / 60;
};
