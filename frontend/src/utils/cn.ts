import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// frappe-ui's text styles (`text-base-medium`, `text-p-sm`) would otherwise
// count as text colours and drop a real colour class next to them.
const isFrappeTextStyle = (value: string) =>
  /^(p-)?(\d*xs|sm|base|md|lg|\d*xl)(-(medium|semibold|bold))?$/.test(value);

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [isFrappeTextStyle] }],
      shadow: [{ shadow: ["base"] }],
    },
    theme: {
      borderRadius: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    },
  },
});

/** Joins class values and lets later Tailwind classes win over earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
