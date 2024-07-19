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
