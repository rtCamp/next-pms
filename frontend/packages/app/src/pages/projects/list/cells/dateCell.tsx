/**
 * External dependencies.
 */
import { Calendar } from "lucide-react";

/**
 * Internal dependencies.
 */
import { formatProjectDate } from "@/lib/utils";

export function DateCell({ isoDate }: { isoDate: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-ink-gray-7 text-base">
      <Calendar className="size-4 shrink-0 text-ink-gray-6" />
      <span className="truncate">{formatProjectDate(isoDate)}</span>
    </span>
  );
}
