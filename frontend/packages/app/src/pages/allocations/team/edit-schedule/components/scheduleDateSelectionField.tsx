/**
 * External dependencies.
 */
import { DayChip } from "@next-pms/design-system/components";
import { mergeClassNames as cn } from "@next-pms/design-system/utils";
import { ErrorMessage } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { DayItem, NormalizedSelection } from "../types";

interface ScheduleDateSelectionFieldProps {
  days: DayItem[];
  headerRangeLabel: string;
  recurrenceHelperText?: string;
  selection: NormalizedSelection | null;
  onDayClick: (date: string) => void;
  error?: string;
}

function ScheduleDateSelectionField({
  days,
  headerRangeLabel,
  recurrenceHelperText,
  selection,
  onDayClick,
  error,
}: ScheduleDateSelectionFieldProps) {
  const showInlineRecurrenceHelper =
    Boolean(recurrenceHelperText) && days.length <= 3;

  return (
    <div className="space-y-0.75">
      <div className="flex items-center justify-between text-base text-ink-gray-5">
        <span>Select dates to edit</span>
        <span className="text-right">{headerRangeLabel}</span>
      </div>
      <div
        className={cn(
          "relative pb-1.5 -mx-3.5",
          showInlineRecurrenceHelper &&
            "flex items-center justify-between gap-3",
        )}
      >
        <div className="absolute top-0 left-0 z-10 w-12 h-full from-surface-white to-transparent pointer-events-none bg-linear-to-r"></div>
        <div className="flex overflow-x-auto no-scrollbar items-start gap-1 py-1.5 px-3.5">
          {days.map((day) => (
            <DayChip
              className="shrink-0"
              key={day.date}
              dayLabel={day.dayLabel}
              dayNumber={day.dayNumber}
              monthLabel={day.monthLabel}
              isMonthBoundary={day.isMonthBoundary}
              state={
                selection &&
                day.date >= selection.startDate &&
                day.date <= selection.endDate
                  ? "active"
                  : "default"
              }
              onClick={() => onDayClick(day.date)}
            />
          ))}
        </div>

        {showInlineRecurrenceHelper ? (
          <p className="shrink-0 text-sm text-ink-gray-4">
            {recurrenceHelperText}
          </p>
        ) : (
          <div className="absolute top-0 right-0 z-10 w-12 h-full from-surface-white to-transparent pointer-events-none bg-linear-to-l"></div>
        )}
      </div>

      {recurrenceHelperText && !showInlineRecurrenceHelper ? (
        <p className="pl-0.5 text-sm text-ink-gray-4">{recurrenceHelperText}</p>
      ) : null}

      {error ? <ErrorMessage message={error} /> : null}
    </div>
  );
}

export default ScheduleDateSelectionField;
