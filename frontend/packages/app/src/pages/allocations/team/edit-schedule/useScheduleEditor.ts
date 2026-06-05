/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { addDays, format, parseISO, subDays } from "date-fns";

/**
 * Internal dependencies.
 */
import type {
  DayItemWithSelection,
  EditScheduleModalProps,
  PreviewRow,
  SelectedRange,
} from "./types";
import {
  buildDays,
  formatRange,
  getTotalHoursForRows,
  normalizeRange,
  toDisplayHours,
} from "./utils";

interface UseScheduleEditorOptions {
  open: boolean;
  initialValues?: EditScheduleModalProps["initialValues"];
  onSave: EditScheduleModalProps["onSave"];
  onOpenChange: (open: boolean) => void;
}

const today = () => format(new Date(), "yyyy-MM-dd");

export function useScheduleEditor({
  open,
  initialValues,
  onSave,
  onOpenChange,
}: UseScheduleEditorOptions) {
  const toast = useToasts();

  const safeValues = initialValues ?? {
    rangeStart: today(),
    rangeEnd: today(),
    defaultHoursPerDay: 0,
  };

  const fullRange = useMemo(
    () => normalizeRange(safeValues.rangeStart, safeValues.rangeEnd),
    [safeValues.rangeStart, safeValues.rangeEnd],
  );

  const defaultHoursPerDay = safeValues.defaultHoursPerDay ?? 0;

  const days = useMemo(
    () => buildDays(fullRange.startDate, fullRange.endDate),
    [fullRange.startDate, fullRange.endDate],
  );

  const [selectedRange, setSelectedRange] = useState<SelectedRange>({
    startDate: null,
    endDate: null,
  });
  const [draftHoursPerDay, setDraftHoursPerDay] = useState(defaultHoursPerDay);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedRange({ startDate: null, endDate: null });
    setDraftHoursPerDay(defaultHoursPerDay);
    setSubmitError("");
  }, [open, defaultHoursPerDay]);

  const normalizedSelection = useMemo(() => {
    const { startDate, endDate } = selectedRange;
    if (!startDate) return null;
    return normalizeRange(startDate, endDate ?? startDate);
  }, [selectedRange]);

  const daysWithSelection = useMemo<DayItemWithSelection[]>(
    () =>
      days.map((day) => ({
        ...day,
        isSelected:
          normalizedSelection !== null &&
          day.date >= normalizedSelection.startDate &&
          day.date <= normalizedSelection.endDate,
      })),
    [days, normalizedSelection],
  );

  const previewRows = useMemo<PreviewRow[]>(() => {
    if (!normalizedSelection) {
      return [
        {
          startDate: fullRange.startDate,
          endDate: fullRange.endDate,
          hoursPerDay: defaultHoursPerDay,
          isSelected: false,
          isModified: false,
        },
      ];
    }

    const rows: PreviewRow[] = [];

    if (normalizedSelection.startDate > fullRange.startDate) {
      rows.push({
        startDate: fullRange.startDate,
        endDate: format(
          subDays(parseISO(normalizedSelection.startDate), 1),
          "yyyy-MM-dd",
        ),
        hoursPerDay: defaultHoursPerDay,
        isSelected: false,
        isModified: false,
      });
    }

    rows.push({
      startDate: normalizedSelection.startDate,
      endDate: normalizedSelection.endDate,
      hoursPerDay: draftHoursPerDay,
      isSelected: true,
      isModified: draftHoursPerDay !== defaultHoursPerDay,
    });

    if (normalizedSelection.endDate < fullRange.endDate) {
      rows.push({
        startDate: format(
          addDays(parseISO(normalizedSelection.endDate), 1),
          "yyyy-MM-dd",
        ),
        endDate: fullRange.endDate,
        hoursPerDay: defaultHoursPerDay,
        isSelected: false,
        isModified: false,
      });
    }

    return rows;
  }, [normalizedSelection, fullRange, defaultHoursPerDay, draftHoursPerDay]);

  const totalScheduledHours = useMemo(
    () => getTotalHoursForRows(previewRows),
    [previewRows],
  );

  const totalHours = useMemo(
    () => toDisplayHours(totalScheduledHours),
    [totalScheduledHours],
  );

  const canSave =
    normalizedSelection !== null && draftHoursPerDay !== defaultHoursPerDay;

  const headerRangeLabel = normalizedSelection
    ? formatRange(normalizedSelection.startDate, normalizedSelection.endDate)
    : formatRange(fullRange.startDate, fullRange.endDate);

  const handleDayClick = useCallback((date: string) => {
    setSelectedRange((currentRange) => {
      const { startDate, endDate } = currentRange;

      // No selection yet, or restarting after a completed range
      if (!startDate || endDate !== null) {
        return { startDate: date, endDate: null };
      }

      // Second click completes the range
      return normalizeRange(startDate, date);
    });
  }, []);

  const handleDurationChange = useCallback((value: number) => {
    setDraftHoursPerDay(value);
  }, []);

  const closeModal = useCallback(() => onOpenChange(false), [onOpenChange]);

  const handleSave = useCallback(async () => {
    if (!normalizedSelection) {
      closeModal();
      return;
    }

    const payload = {
      totalHours: totalScheduledHours,
      bands: [
        {
          startDate: normalizedSelection.startDate,
          endDate: normalizedSelection.endDate,
          hoursPerDay: draftHoursPerDay,
        },
      ],
    };

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSave?.(payload);
      toast.success("Schedule updated.");
      closeModal();
    } catch {
      setSubmitError("Unable to save schedule changes.");
    } finally {
      setSubmitting(false);
    }
  }, [
    closeModal,
    draftHoursPerDay,
    normalizedSelection,
    onSave,
    totalScheduledHours,
    toast,
  ]);

  return {
    days: daysWithSelection,
    draftHoursPerDay,
    previewRows,
    totalHours,
    canSave,
    headerRangeLabel,
    submitting,
    submitError,
    handleDayClick,
    handleDurationChange,
    handleSave,
    closeModal,
  };
}
