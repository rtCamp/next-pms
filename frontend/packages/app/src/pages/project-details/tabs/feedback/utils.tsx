import { format, parse } from "date-fns";

export function getMonthName(key: string): string {
  const date = parse(key, "yyyy-M", new Date());
  return format(date, "MMMM");
}
