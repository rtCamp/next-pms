/**
 * External dependencies.
 */
import { useEffect, useMemo, useState } from "react";
import { DayChip, DurationInput } from "@next-pms/design-system/components";
import {
  Button,
  Dialog,
  ErrorMessage,
  Select,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameMonth,
  parseISO,
} from "date-fns";

/**
 * Internal dependencies.
 */
import { applyEditsToLabels } from "./constants";
import type {
  ApplyEditsTo,
  EditScheduleModalProps,
  EditScheduleSeedBand,
} from "./types";

type EditScheduleRow = EditScheduleSeedBand & { id: string };

const toDisplayHours = (value: number) => {
  const rounded = Number(value.toFixed(2));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const getDayCount = (startDate: string, endDate: string) => {
  const [safeStart, safeEnd] =
    startDate <= endDate ? [startDate, endDate] : [endDate, startDate];

  return differenceInCalendarDays(parseISO(safeEnd), parseISO(safeStart)) + 1;
};

const formatRange = (startDate: string, endDate: string) => {
  const [safeStart, safeEnd] =
    startDate <= endDate ? [startDate, endDate] : [endDate, startDate];

  return `${format(parseISO(safeStart), "MMM d")} - ${format(parseISO(safeEnd), "MMM d")}`;
};

const buildStripDays = (rangeStart: string, rangeEnd: string) => {
  const [safeStart, safeEnd] =
    rangeStart <= rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart];
  const start = parseISO(safeStart);
  const dayCount = getDayCount(safeStart, safeEnd);

  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(start, index);
    const previousDate = index > 0 ? addDays(start, index - 1) : null;
    const isMonthBoundary = !previousDate || !isSameMonth(previousDate, date);

    return {
      date: format(date, "yyyy-MM-dd"),
      dayLabel: format(date, "EEE"),
      dayNumber: Number(format(date, "d")),
      monthLabel: isMonthBoundary
        ? format(date, "MMM").toUpperCase()
        : undefined,
      isMonthBoundary,
    };
  });
};

const seedRows = (
  initialValues: EditScheduleModalProps["initialValues"],
): EditScheduleRow[] => {
  if (initialValues.scheduleBands?.length) {
    return initialValues.scheduleBands.map((band, index) => ({
      ...band,
      id: `row-${index + 1}`,
      repeatForwardCount: band.repeatForwardCount ?? 0,
    }));
  }

  if (
    initialValues.defaultHoursPerDay &&
    initialValues.defaultHoursPerDay > 0
  ) {
    return [
      {
        id: "row-default",
        startDate: initialValues.rangeStart,
        endDate: initialValues.rangeEnd,
        hoursPerDay: initialValues.defaultHoursPerDay,
        repeatForwardCount: 0,
      },
    ];
  }

  return [];
};

const calculateTotalHours = (rows: EditScheduleRow[]) => {
  return rows.reduce((total, row) => {
    const multiplier = Math.max(1, (row.repeatForwardCount ?? 0) + 1);
    return (
      total +
      getDayCount(row.startDate, row.endDate) * row.hoursPerDay * multiplier
    );
  }, 0);
};

function EditScheduleModal({
  open,
  onOpenChange,
  initialValues,
  onSave,
}: EditScheduleModalProps) {
  const toast = useToasts();
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [summaryRows, setSummaryRows] = useState<EditScheduleRow[]>([]);
  const [draftHoursPerDay, setDraftHoursPerDay] = useState(
    initialValues.defaultHoursPerDay ?? 0,
  );
  const [applyEditsTo, setApplyEditsTo] = useState<ApplyEditsTo>(
    initialValues.applyEditsTo ?? "this-allocation",
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const stripDays = useMemo(() => {
    return buildStripDays(initialValues.rangeStart, initialValues.rangeEnd);
  }, [initialValues.rangeEnd, initialValues.rangeStart]);

  const recurringHint = useMemo(() => {
    if (
      initialValues.mode !== "recurring" ||
      !initialValues.recurringWeekCount
    ) {
      return null;
    }

    return `Repeats for ${initialValues.recurringWeekCount} weeks`;
  }, [initialValues.mode, initialValues.recurringWeekCount]);

  const totalHours = useMemo(
    () => calculateTotalHours(summaryRows),
    [summaryRows],
  );

  const selectedRow = useMemo(
    () => summaryRows.find((row) => row.id === selectedRowId) ?? null,
    [summaryRows, selectedRowId],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const rows = seedRows(initialValues);

    setSummaryRows(rows);
    setSelectedRowId(rows[0]?.id ?? null);
    setDraftHoursPerDay(
      rows[0]?.hoursPerDay ?? initialValues.defaultHoursPerDay ?? 0,
    );
    setSelectedDay(initialValues.rangeStart);
    setApplyEditsTo(initialValues.applyEditsTo ?? "this-allocation");
    setSubmitError("");
  }, [initialValues, open]);

  const commitSelectionHours = (hoursPerDay: number) => {
    setDraftHoursPerDay(hoursPerDay);

    if (!selectedRowId) {
      return;
    }

    setSummaryRows((rows) =>
      rows.map((row) => {
        if (row.id !== selectedRowId) {
          return row;
        }

        return {
          ...row,
          hoursPerDay,
        };
      }),
    );
  };

  const closeModal = () => {
    onOpenChange(false);
  };

  const handleSave = async () => {
    const payload = {
      mode: initialValues.mode,
      applyEditsTo,
      recurringWeekCount: initialValues.recurringWeekCount,
      totalHours,
      bands: summaryRows.map((row) => ({
        startDate: row.startDate,
        endDate: row.endDate,
        hoursPerDay: row.hoursPerDay,
        repeatForwardCount: row.repeatForwardCount,
      })),
    };

    try {
      setSubmitting(true);
      setSubmitError("");

      await onSave?.(payload);

      toast.success("UI demo updated.");
      closeModal();
    } catch {
      setSubmitError("Unable to save schedule changes.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRangeLabel = selectedRow
    ? formatRange(selectedRow.startDate, selectedRow.endDate)
    : selectedDay
      ? formatRange(selectedDay, selectedDay)
      : formatRange(initialValues.rangeStart, initialValues.rangeEnd);

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
          <span className="text-lg text-ink-gray-8 font-medium">
            Edit schedule
          </span>
        ),
        size: "sm",
      }}
      actions={
        <div className="-mt-5 flex w-full items-center justify-end gap-2">
          <Button variant="ghost" label="Cancel" onClick={closeModal} />
          <Button
            variant="solid"
            label="Save changes"
            onClick={handleSave}
            loading={submitting}
            disabled={submitting}
          />
        </div>
      }
    >
      <div className="-mt-2 space-y-4">
        <div className="space-y-1.5 pl-0.5">
          <div className="flex items-center justify-between text-base text-ink-gray-5">
            <span>Select dates to edit</span>
            <span className="text-right">{selectedRangeLabel}</span>
          </div>

          <div className="relative overflow-x-auto overflow-y-visible pb-2 no-scrollbar">
            <div className="flex min-w-fit items-center gap-1 pr-8">
              {stripDays.map((day) => (
                <DayChip
                  key={day.date}
                  dayLabel={day.dayLabel}
                  dayNumber={day.dayNumber}
                  monthLabel={day.monthLabel}
                  isMonthBoundary={day.isMonthBoundary}
                  state={day.date === selectedDay ? "active" : "default"}
                  onClick={() => setSelectedDay(day.date)}
                />
              ))}
            </div>
          </div>

          {recurringHint ? (
            <p className="text-[11px] leading-none text-ink-gray-5">
              {recurringHint}
            </p>
          ) : null}
        </div>

        <div className="flex w-full items-start gap-2">
          <div className="flex-1 space-y-1.5">
            <label className="block text-base text-ink-gray-5">
              Edit hours / day
            </label>
            <DurationInput
              value={draftHoursPerDay}
              variant="compact"
              onChange={commitSelectionHours}
            />
          </div>

          <div className="flex-1 space-y-1.5">
            <label className="block text-base text-ink-gray-5">
              Total hours
            </label>
            <TextInput
              value={toDisplayHours(totalHours)}
              disabled={true}
              variant="outline"
              size="md"
            />
          </div>
        </div>

        {initialValues.mode === "recurring" ? (
          <div className="space-y-1.5">
            <label className="block text-base text-ink-gray-5">
              Apply edits to
            </label>
            <Select
              options={Object.entries(applyEditsToLabels).map(
                ([value, label]) => ({
                  label,
                  value,
                }),
              )}
              value={applyEditsTo}
              onChange={(value) =>
                setApplyEditsTo((value as ApplyEditsTo) ?? "this-allocation")
              }
              variant="outline"
              size="md"
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label className="block text-base text-ink-gray-5">
            Schedule summary
          </label>

          {summaryRows.length ? (
            <div className="overflow-hidden rounded-lg border border-outline-gray-2">
              {summaryRows.map((row) => {
                const suffix =
                  (row.repeatForwardCount ?? 0) > 0
                    ? ` (+${row.repeatForwardCount} weeks)`
                    : "";
                const rangeHours =
                  getDayCount(row.startDate, row.endDate) *
                  row.hoursPerDay *
                  Math.max(1, (row.repeatForwardCount ?? 0) + 1);

                return (
                  <button
                    key={row.id}
                    type="button"
                    className={`grid w-full grid-cols-2 border-b border-outline-gray-2 text-left last:border-b-0 ${selectedRowId === row.id ? "bg-surface-gray-3" : "bg-surface-white"}`}
                    onClick={() => {
                      setSelectedRowId(row.id);
                      setDraftHoursPerDay(row.hoursPerDay);
                    }}
                  >
                    <span className="truncate px-2 py-2.5 text-sm text-ink-gray-6">
                      {formatRange(row.startDate, row.endDate)}
                      {suffix}
                    </span>
                    <span className="truncate px-2 py-2.5 text-sm text-ink-gray-6">
                      {toDisplayHours(row.hoursPerDay)}h/day ·{" "}
                      {toDisplayHours(rangeHours)} hours
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-outline-gray-2 px-2 py-3 text-sm text-ink-gray-5">
              Select dates and set hours to start building a schedule summary.
            </div>
          )}

          {submitError ? <ErrorMessage message={submitError} /> : null}
        </div>
      </div>
    </Dialog>
  );
}

export default EditScheduleModal;
