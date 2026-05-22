/**
 * Internal dependencies.
 */
import { formatProjectDate } from "@/lib/utils";

export function DateCell({ date }: { date: string }) {
  return (
    <span className="text-base text-ink-gray-6 truncate">
      {formatProjectDate(date)}
    </span>
  );
}
