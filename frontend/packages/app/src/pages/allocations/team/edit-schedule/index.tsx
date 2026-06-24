/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Dialog } from "@rtcamp/frappe-ui-react";
import { format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import ScheduleDateSelectionField from "./components/scheduleDateSelectionField";
import ScheduleHoursPerDayField from "./components/scheduleHoursPerDayField";
import ScheduleSummaryTable from "./components/scheduleSummaryTable";
import ScheduleTotalHoursField from "./components/scheduleTotalHoursField";
import type { EditScheduleModalProps, EditScheduleValueMode } from "./types";
import {
  buildDays,
  buildScheduleDraft,
  normalizeRange,
  toDisplayHours,
} from "./utils";

function EditScheduleModal({
  open,
  onOpenChange,
  initialValues,
}: EditScheduleModalProps) {
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [selectionAnchor, setSelectionAnchor] = useState<string | null>(null);
  const [selection, setSelection] = useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: "", endDate: "" });
  const [inputValue, setInputValue] = useState(0);
  const [inputMode, setInputMode] =
    useState<EditScheduleValueMode>("hoursPerDay");

  const safeValues = useMemo(
    () =>
      initialValues ?? {
        allocationName: "",
        rangeStart: today,
        rangeEnd: today,
        defaultHoursPerDay: 0,
      },
    [initialValues, today],
  );

  const defaultHoursPerDay = safeValues.defaultHoursPerDay ?? 0;
  const isRecurringAllocation = Boolean(safeValues.recurrenceId);
  const fullRange = useMemo(
    () =>
      normalizeRange(
        safeValues.rangeStart || today,
        safeValues.rangeEnd || safeValues.rangeStart || today,
      ),
    [safeValues.rangeEnd, safeValues.rangeStart, today],
  );
  const recurrenceHelperText = useMemo(() => {
    if (
      !isRecurringAllocation ||
      !safeValues.recurrenceWeekCount ||
      !safeValues.recurrenceSeriesEndDate
    ) {
      return undefined;
    }

    return `Repeats for ${safeValues.recurrenceWeekCount} week${safeValues.recurrenceWeekCount === 1 ? "" : "s"} till ${format(parseISO(safeValues.recurrenceSeriesEndDate), "MMM d")}`;
  }, [
    isRecurringAllocation,
    safeValues.recurrenceSeriesEndDate,
    safeValues.recurrenceWeekCount,
  ]);
  const days = useMemo(
    () => buildDays(fullRange.startDate, fullRange.endDate),
    [fullRange.endDate, fullRange.startDate],
  );

  const scheduleDraft = useMemo(
    () =>
      buildScheduleDraft({
        rangeStart: fullRange.startDate,
        rangeEnd: fullRange.endDate,
        defaultHoursPerDay,
        override: safeValues.override,
        schedule: {
          selection,
          input: { value: inputValue, mode: inputMode },
        },
      }),
    [
      defaultHoursPerDay,
      fullRange.endDate,
      fullRange.startDate,
      inputMode,
      inputValue,
      safeValues.override,
      selection,
    ],
  );

  const resetState = useCallback(() => {
    setSelection({ startDate: "", endDate: "" });
    setSelectionAnchor(null);
    setInputValue(defaultHoursPerDay);
    setInputMode("hoursPerDay");
  }, [defaultHoursPerDay]);

  useEffect(() => {
    if (!open) {
      return;
    }

    resetState();
  }, [open, resetState]);

  const handleDayClick = useCallback(
    (date: string) => {
      if (!selectionAnchor) {
        setSelectionAnchor(date);
        setSelection({ startDate: date, endDate: date });
        return;
      }

      const nextSelection = normalizeRange(selectionAnchor, date);
      setSelectionAnchor(null);
      setSelection(nextSelection);
    },
    [selectionAnchor],
  );

  const closeModal = useCallback(() => {
    onOpenChange(false);
    resetState();
  }, [onOpenChange, resetState]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          onOpenChange(true);
          return;
        }
        closeModal();
      }}
      options={{
        title: () => (
          <span className="text-lg font-medium text-ink-gray-7">
            Edit schedule
          </span>
        ),
        size: "sm",
      }}
      actions={
        <div className="flex w-full items-center justify-end gap-2">
          <Button variant="ghost" label="Cancel" onClick={closeModal} />
          <Button variant="solid" label="Save changes" disabled />
        </div>
      }
      className="max-w-90"
      classNames={{
        content: "p-[14px] sm:p-[14px] pb-0 sm:pb-0",
        header: "mb-5",
        footer: "p-[14px] sm:p-[14px] pt-5 sm:pt-5",
      }}
    >
      <div className="space-y-3">
        <ScheduleDateSelectionField
          days={days}
          headerRangeLabel={scheduleDraft.headerRangeLabel}
          recurrenceHelperText={recurrenceHelperText}
          selection={scheduleDraft.selection}
          onDayClick={handleDayClick}
        />
        <div className="flex w-full items-start gap-2 pb-1.5">
          <ScheduleHoursPerDayField
            value={scheduleDraft.hoursPerDay}
            disabled={!scheduleDraft.hasSelection}
            onChange={(value) => {
              setInputMode("hoursPerDay");
              setInputValue(value);
            }}
          />
          <ScheduleTotalHoursField
            value={
              scheduleDraft.hasSelection
                ? toDisplayHours(scheduleDraft.totalHours)
                : ""
            }
            disabled={!scheduleDraft.hasSelection}
            onChange={(value) => {
              setInputMode("totalHours");
              setInputValue(value);
            }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-base text-ink-gray-5">
            Schedule summary
          </label>
          <ScheduleSummaryTable rows={scheduleDraft.previewRows} />
        </div>
      </div>
    </Dialog>
  );
}

export default EditScheduleModal;
