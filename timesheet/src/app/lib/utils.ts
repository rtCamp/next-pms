import { type ClassValue,clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); 
  const day = String(today.getDate()).padStart(2, '0');

  return  `${year}-${month}-${day}`;

}

export function parseFrappeErrorMsg(StringError: string) {
  try {
    const jsonMsgArray = JSON.parse(StringError);
    if (jsonMsgArray.length > 0) {
      const jsonObjectStr = jsonMsgArray[0];
      return JSON.parse(jsonObjectStr);
    }
  } catch (e) { 
    return "Error parsing json."
  }
  
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
export const getSiteName = () => {
  // @ts-ignore
    return window.frappe?.boot?.sitename ?? import.meta.env.VITE_SITE_NAME
}

export function getDateFromDateAndTime(dateTimeString: string) {
  // Split the date and time parts exa: '2024-05-08 00:00:00'
  const parts = dateTimeString.split(" ");
  return parts[0];
}

export function isDateNotInCurrentWeek(dateStr: string) {
  const givenDate = new Date(dateStr);
  const today = new Date();

  // Calculate the start and end of the current week
  const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0); // Set to start of day

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - dayOfWeek));
  endOfWeek.setHours(23, 59, 59, 999); // Set to end of day

  // Check if the given date is outside the current week
  return givenDate < startOfWeek || givenDate > endOfWeek;
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);

  const month = date.toLocaleString("default", { month: "short" });
  const dayOfMonth = date.getDate();
  const dayOfWeek = date.toLocaleString("default", { weekday: "short" });
  return { date: `${month} ${dayOfMonth}`, day: dayOfWeek };
}
