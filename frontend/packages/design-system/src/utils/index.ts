/**
 * External dependencies.
 */
import { type ClassValue, clsx } from "clsx";
import { isToday } from "date-fns";
import { twMerge } from "tailwind-merge";
/**
 * Internal dependencies.
 */
import { getUTCDateTime } from "./date";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deBounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
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
  return isToday(getUTCDateTime(date)) ? "bg-slate-100" : "";
};

export function floatToTime(
  float: number,
  hourPadding: number = 1,
  minutePadding: number = 2
) {
  const totalMinutes = Math.round(float * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const formattedHours = String(hours).padStart(hourPadding, "0");
  const formattedMinutes = String(minutes).padStart(minutePadding, "0");

  return `${formattedHours}:${formattedMinutes}`;
}

export const preProcessLink = (text: string) => {
  const linkRegex = /\b((https?:\/\/|www\.)[^\s]+)\b/gi;
  const processedText = text.replace(linkRegex, (url) => {
    // Ensure the URL has a protocol
    const href = url.startsWith("http") ? url : `https://${url}`;
    return `<a 
                href="${href}" 
                class="text-blue-500 hover:text-blue-700 underline" 
                target="_blank"
                rel="noopener noreferrer">${url}</a>`;
  });
  return processedText;
};
