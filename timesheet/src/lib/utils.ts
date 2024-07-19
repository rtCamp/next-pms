import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

export const getSiteName = () => {
  // @ts-ignore
  return window.frappe?.boot?.sitename ?? import.meta.env.VITE_SITE_NAME
}
export function parseFrappeErrorMsg(error: any) {
  try {

    const e = error._server_messages ?? error._debug_message;
    if (error.exception && !e) {
      return error.exception;
    }
    if (e) {
      const jsonMsgArray = JSON.parse(e);

      if (jsonMsgArray.length > 0) {
        const jsonObjectStr = jsonMsgArray[0];
        const e = JSON.parse(jsonObjectStr);
        return e.message;
      }
    }
  } catch (e) {
    return "Something went wrong! Please try again later."
  }
}

export function getFormatedDate(date: string | Date) {
  if (typeof date == "string") {
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
export function getTodayDate() {
  const today = new Date();
  return getFormatedDate(today);
}

export function prettyDate(dateString: string) {
  const date = new Date(dateString);

  const month = date.toLocaleString("default", { month: "short" });
  const dayOfMonth = date.getDate();
  const dayOfWeek = date.toLocaleString("default", { weekday: "short" });
  return { date: `${month} ${dayOfMonth}`, day: dayOfWeek };
}
export function getDateFromDateAndTime(dateTimeString: string) {
  // Split the date and time parts exa: '2024-05-08 00:00:00'
  const parts = dateTimeString.split(" ");
  return parts[0];
}

export function floatToTime(float: number) {
  // Extract hours and minutes from the float
  let hours = Math.floor(float);
  let minutes = Math.round((float % 1) * 60);

  // Format hours and minutes to always be two digits
  let formattedHours = String(hours).padStart(2, '0');
  let formattedMinutes = String(minutes).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}`;
}
