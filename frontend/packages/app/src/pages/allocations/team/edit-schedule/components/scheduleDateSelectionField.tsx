/**
 * External dependencies.
 */
import { DayChip } from "@next-pms/design-system/components";
import { ErrorMessage } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { ScheduleFieldGroupApi } from "../scheduleFieldGroup";
import type { DayItem, NormalizedSelection } from "../types";
import { getErrorMessage, normalizeRange } from "../utils";

interface ScheduleDateSelectionFieldProps {
  group: ScheduleFieldGroupApi;
  days: DayItem[];
  headerRangeLabel: string;
  recurrenceHelperText?: string;
  selection: NormalizedSelection | null;
  selectionAnchor: string | null;
  setSelectionAnchor: (value: string | null) => void;
}

function ScheduleDateSelectionField({
  group,
  days,
  headerRangeLabel,
  recurrenceHelperText,
  selection,
  selectionAnchor,
  setSelectionAnchor,
}: ScheduleDateSelectionFieldProps) {
  const showInlineRecurrenceHelper =
    Boolean(recurrenceHelperText) && days.length <= 3;

  return (
    <group.Field
      name="selection.startDate"
      children={(startField) => (
        <group.Field
          name="selection.endDate"
          children={(endField) => (
            <div className="space-y-1.5 pl-0.5">
              <div className="flex items-center justify-between text-base text-ink-gray-5">
                <span>Select dates to edit</span>
                <span className="text-right">{headerRangeLabel}</span>
              </div>

              <div
                className={
                  showInlineRecurrenceHelper
                    ? "flex items-center justify-between gap-3 pb-1"
                    : "pb-1"
                }
              >
                <div className="flex flex-wrap items-start gap-1">
                  {days.map((day) => (
                    <DayChip
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
                      onClick={() => {
                        if (!selectionAnchor) {
                          setSelectionAnchor(day.date);
                          startField.handleChange(day.date);
                          endField.handleChange(day.date);
                          return;
                        }

                        const nextSelection = normalizeRange(
                          selectionAnchor,
                          day.date,
                        );
                        setSelectionAnchor(null);
                        startField.handleChange(nextSelection.startDate);
                        endField.handleChange(nextSelection.endDate);
                      }}
                    />
                  ))}
                </div>

                {showInlineRecurrenceHelper ? (
                  <p className="shrink-0 text-sm text-ink-gray-4">
                    {recurrenceHelperText}
                  </p>
                ) : null}
              </div>

              {recurrenceHelperText && !showInlineRecurrenceHelper ? (
                <p className="pl-0.5 text-sm text-ink-gray-4">
                  {recurrenceHelperText}
                </p>
              ) : null}

              {(!startField.state.meta.isValid ||
                !endField.state.meta.isValid) && (
                <ErrorMessage
                  message={
                    getErrorMessage(startField.state.meta.errors[0]) ??
                    getErrorMessage(endField.state.meta.errors[0])
                  }
                />
              )}
            </div>
          )}
        />
      )}
    />
  );
}

export default ScheduleDateSelectionField;
