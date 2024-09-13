import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Error } from "frappe-js-sdk/lib/frappe_app/types";
import { WorkingFrequency } from "@/types";
import { TScreenSize } from "@/store/app";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

export function setCookie(name: string, value: string, days: number) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

export const getSiteName = () => {
  // eslint-disable-next-line
  // @ts-expect-error
  return window.frappe?.boot?.sitename ?? import.meta.env.VITE_SITE_NAME;
};
export function parseFrappeErrorMsg(error: Error) {
  try {
    const e = error._server_messages;
    if (error.exception && !e) {
      return removeHtmlString(error.exception);
    }

    if (e) {
      const jsonMsgArray = JSON.parse(e);
      if (jsonMsgArray.length > 0) {
        const jsonObjectStr = jsonMsgArray[0];
        const e = JSON.parse(jsonObjectStr);
        return removeHtmlString(e.message);
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
    } else if (error._error_message) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return removeHtmlString(error._error_message);
    }
  } catch (err) {
    return "Something went wrong! Please try again later.";
  }
}

function removeHtmlString(data: string) {
  return data.replace(/<\/?[^>]+(>|$)/g, "");
}

export function getFormatedDate(date: string | Date) {
  if (typeof date == "string") {
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
export function getTodayDate() {
  const today = new Date();
  return getFormatedDate(today);
}

export function prettyDate(dateString: string, isLong: boolean = false) {
  const date = new Date(dateString);

  const month = date.toLocaleString("default", { month: "short" });
  const dayOfMonth = date.getDate();
  const dayOfWeek = date.toLocaleString("default", {
    weekday: !isLong ? "short" : "long",
  });
  return { date: `${month} ${dayOfMonth}`, day: dayOfWeek };
}
export function getDateFromDateAndTime(dateTimeString: string) {
  // Split the date and time parts exa: '2024-05-08 00:00:00'
  const parts = dateTimeString.split(" ");
  return parts[0];
}

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

export function calculateExtendedWorkingHour(
  hours: number,
  expected_hours: number,
  frequency: WorkingFrequency,
) {
  if (frequency === "Per Day") {
    if (hours > expected_hours) {
      return 2;
    } else if (hours < expected_hours) {
      return 0;
    } else {
      return 1;
    }
  }
  const perDay = expected_hours / 5;
  if (hours > perDay) {
    return 2;
  } else if (hours < perDay) {
    return 0;
  } else {
    return 1;
  }
}

export function calculateWeeklyHour(
  hours: number,
  expected_hours: number,
  frequency: WorkingFrequency,
) {
  if (frequency === "Per Day") {
    expected_hours = expected_hours * 5;
  }
  if (hours > expected_hours) {
    return 2;
  } else if (hours < expected_hours) {
    return 0;
  } else {
    return 1;
  }
}

export const expectatedHours = (
  expected_hours: number,
  frequency: WorkingFrequency,
): number => {
  if (frequency === "Per Day") {
    return expected_hours;
  }
  return expected_hours / 5;
};

export const checkScreenSize = (): TScreenSize => {
  const width = window.innerWidth;

  if (width < 640) {
    return "sm";
  } else if (width >= 640 && width < 768) {
    return "md";
  } else if (width >= 768 && width < 1024) {
    return "lg";
  } else if (width >= 1024 && width < 1280) {
    return "xl";
  } else {
    return "2xl";
  }
};

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

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
}
