/**
 * External dependencies.
 */
import { Calendar } from "lucide-react";

/**
 * Internal dependencies.
 */
import { formatProjectDate } from "./format";

export function DateCell({ isoDate }: { isoDate: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-gray-7">
      <Calendar className="size-3.5 text-ink-gray-4" />
      {formatProjectDate(isoDate)}
    </span>
  );
}
