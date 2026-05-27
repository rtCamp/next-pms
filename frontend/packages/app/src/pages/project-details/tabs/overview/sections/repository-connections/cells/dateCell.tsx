/**
 * External dependencies.
 */
import { format, parse } from "date-fns";

export function DateCell({ date }: { date: string }) {
  const parsed = parse(date, "yyyy-MM-dd", new Date());
  return (
    <span className="text-base text-ink-gray-6 truncate">
      {format(parsed, "MMM d, yyyy")}
    </span>
  );
}
