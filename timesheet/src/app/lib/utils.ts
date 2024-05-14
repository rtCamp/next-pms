import { type ClassValue,clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useFrappeGetCall } from 'frappe-react-sdk'

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

export const useEmployeeData = () => { 
    let employee = getCookie("employee");
    if (!employee) {
      const { data } = useFrappeGetCall("timesheet_enhancer.api.utils.get_employee_from_user");
      if (data) {
        setCookie("employee", data?.message, 30);
        return data?.message;
      }
    }
    return employee;
}
