import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Error } from "frappe-js-sdk/lib/frappe_app/types";
import { TaskData, WorkingFrequency } from "@/types";
import { TScreenSize } from "@/store/app";
import { HolidayProp } from "@/types/timesheet";

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
  const messages = getErrorMessages(error);
  let message = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages.forEach((m: any) => {
    message += `${m.message}\n`;
  });
  if (message) {
    return removeHtmlString(message);
  } else {
    return "Something went wrong. Please try again later.";
  }
}

export function removeHtmlString(data: string) {
  return data.replace(/<\/?[^>]+(>|$)/g, "");
}

export function getDateTimeForMultipleTimeZoneSupport(
  date: string | Date = "",
): Date {
  if (!date) {
    return getUTCDateTime();
  }
  if (typeof date == "string") {
    date = new Date(date + "T00:00:00");
  }
  return date;
}

export function getUTCDateTime() {
  return new Date();
}

export function getFormatedDate(date: string | Date) {
  date = getDateTimeForMultipleTimeZoneSupport(date);
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
  const date = getDateTimeForMultipleTimeZoneSupport(dateString);

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

export const createFalseValuedObject = (obj) => {
  const newFalseValueObject: { [key: string]: boolean } = {};
  if (Object.keys(obj).length > 0) {
    for (const key of obj) {
      newFalseValueObject[key] = true;
    }
  }
  return newFalseValueObject;
};
export const isLiked = (likedBy: string, user: string) => {
  if (likedBy) {
    likedBy = JSON.parse(likedBy);
    if (likedBy && likedBy.includes(user)) {
      return true;
    }
  }
  return false;
};

export const getHolidayList = (holidays: Array<HolidayProp>) => {
  return holidays.map((holiday) => {
    return holiday.holiday_date;
  });
};

export const getErrorMessages = (error: Error) => {
  let eMessages = error?._server_messages
    ? JSON.parse(error?._server_messages)
    : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eMessages = eMessages.map((m: any) => {
    try {
      return JSON.parse(m);
    } catch (e) {
      return m;
    }
  });

  if (eMessages.length === 0) {
    // Get the message from the exception by removing the exc_type
    const index = error?.exception?.indexOf(":");
    if (index) {
      const exception = error?.exception?.slice(index + 1);
      if (exception) {
        eMessages = [
          {
            message: exception,
            title: "Error",
          },
        ];
      }
    }

    if (eMessages.length === 0) {
      eMessages = [
        {
          message: error?.message,
          title: "Error",
        },
      ];
    }
  }
  return eMessages;
};

export const flatTableDataToNestedProjectDataConversion = (
  tasks: TaskData[],
): ProjectNestedTaskData[] => {
  const projectMap = tasks.reduce(
    (acc, task) => {
      const projectName = task.project_name || "Unnamed Project";

      if (!acc[projectName]) {
        acc[projectName] = {
          project_name: projectName,
          name: task.project, // Assuming `name` is the project identifier
          tasks: [],
        };
      }

      acc[projectName].tasks.push(task);
      return acc;
    },
    {} as Record<string, ProjectNestedTaskData>,
  );

  return Object.values(projectMap);
};

export const checkIsMobile =()=>{
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}