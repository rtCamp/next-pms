/**
 * External dependencies.
 */
import { CalendarDeadline } from "@rtcamp/frappe-ui-react/icons";
import { format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import { TextCell } from "./textCell";

export function DateCell({ isoDate }: { isoDate: string | null }) {
  if (!isoDate) {
    return <TextCell text="N/A" />;
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-ink-gray-6 text-base">
      <CalendarDeadline className="size-4 shrink-0 text-ink-gray-6" />
      <span className="truncate">
        {format(parseISO(isoDate), "MMM d, yyyy")}
      </span>
    </span>
  );
}
