/**
 * Internal dependencies.
 */
import { formatProjectDate, mergeClassNames } from "@/lib/utils";

type DateCellProps = {
  date?: string;
  overdue?: boolean;
};

export function DateCell({ date, overdue }: DateCellProps) {
  if (!date) {
    return <span>—</span>;
  }

  return (
    <span
      className={mergeClassNames(overdue ? "text-red-500" : "text-ink-gray-6")}
    >
      {formatProjectDate(date)}
    </span>
  );
}
