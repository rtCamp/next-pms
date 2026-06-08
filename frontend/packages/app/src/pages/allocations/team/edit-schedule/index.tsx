/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { DayChip, DurationInput } from "@next-pms/design-system/components";
import {
  Button,
  Dialog,
  ErrorMessage,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm, useStore } from "@tanstack/react-form";
import { format } from "date-fns";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn, parseFrappeErrorMsg } from "@/lib/utils";
import { editScheduleFormSchema, type EditScheduleFormValues } from "./schema";
import type { EditScheduleModalProps } from "./types";
import {
  buildDayOverrides,
  buildDays,
  buildPreviewRows,
  formatRange,
  getRangeHours,
  getTotalHoursForRows,
  normalizeRange,
  toDisplayHours,
} from "./utils";

function EditScheduleModal({
  open,
  onOpenChange,
  initialValues,
  onSuccess,
}: EditScheduleModalProps) {
  const toast = useToasts();
  const { call: editAllocation } = useFrappePostCall(
    "next_pms.resource_management.api.allocation.edit_allocation",
  );
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [selectionAnchor, setSelectionAnchor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
  const fullRange = useMemo(
    () => normalizeRange(safeValues.rangeStart, safeValues.rangeEnd),
    [safeValues.rangeEnd, safeValues.rangeStart],
  );
  const days = useMemo(
    () => buildDays(fullRange.startDate, fullRange.endDate),
    [fullRange.endDate, fullRange.startDate],
  );

  const formDefaultValues = useMemo<EditScheduleFormValues>(
    () => ({
      startDate: "",
      endDate: "",
      hoursPerDay: defaultHoursPerDay,
    }),
    [defaultHoursPerDay],
  );

  const form = useForm({
    defaultValues: formDefaultValues,
    validators: {
      onSubmit: editScheduleFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!initialValues?.allocationName) {
        setSubmitError("Allocation ID not found");
        return;
      }

      const normalizedSelection = normalizeRange(
        value.startDate,
        value.endDate,
      );
      const dayOverrides = buildDayOverrides(
        normalizedSelection.startDate,
        normalizedSelection.endDate,
        value.hoursPerDay,
      );

      try {
        setSubmitting(true);
        setSubmitError("");
        await editAllocation({
          name: initialValues.allocationName,
          edit_mode: "only_this",
          allocation: {
            doctype: "Resource Allocation",
            employee: initialValues.employeeId ?? "",
            project: initialValues.projectId ?? null,
            customer: initialValues.customer ?? "",
            allocation_start_date: initialValues.rangeStart,
            allocation_end_date: initialValues.rangeEnd,
            hours_allocated_per_day: initialValues.defaultHoursPerDay,
            include_weekends: true,
            is_billable: Number(initialValues.isBillable ?? true),
            status: initialValues.isTentative ? "Tentative" : "Confirmed",
            note: initialValues.note ?? "",
          },
          day_overrides: dayOverrides,
        });
        await onSuccess?.({
          ...(safeValues.employeeId
            ? { employeeIds: [safeValues.employeeId] }
            : {}),
          ...(safeValues.projectId
            ? { projectIds: [safeValues.projectId] }
            : {}),
        });
        toast.success("Schedule updated.");
        if (!onSuccess) {
          onOpenChange(false);
        }
      } catch (error) {
        setSubmitError(parseFrappeErrorMsg(error as FrappeError));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const [selectedStartDate, selectedEndDate, draftHoursPerDay] = useStore(
    form.store,
    (state) =>
      [
        state.values.startDate,
        state.values.endDate,
        state.values.hoursPerDay,
      ] as const,
  );

  const normalizedSelection = useMemo(
    () =>
      selectedStartDate && selectedEndDate
        ? normalizeRange(selectedStartDate, selectedEndDate)
        : null,
    [selectedEndDate, selectedStartDate],
  );

  const previewRows = useMemo(
    () =>
      buildPreviewRows({
        rangeStart: fullRange.startDate,
        rangeEnd: fullRange.endDate,
        defaultHoursPerDay,
        override: safeValues.override,
        selection: normalizedSelection
          ? {
              startDate: normalizedSelection.startDate,
              endDate: normalizedSelection.endDate,
              hoursPerDay: draftHoursPerDay,
            }
          : null,
      }),
    [
      defaultHoursPerDay,
      draftHoursPerDay,
      fullRange.endDate,
      fullRange.startDate,
      normalizedSelection,
      safeValues.override,
    ],
  );

  const totalHours = useMemo(
    () => toDisplayHours(getTotalHoursForRows(previewRows)),
    [previewRows],
  );

  const headerRangeLabel = normalizedSelection
    ? formatRange(normalizedSelection.startDate, normalizedSelection.endDate)
    : formatRange(fullRange.startDate, fullRange.endDate);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(formDefaultValues);
    setSelectionAnchor(null);
    setSubmitError("");
  }, [form, formDefaultValues, open]);

  const closeModal = useCallback(() => {
    onOpenChange(false);
    form.reset(formDefaultValues);
    setSelectionAnchor(null);
    setSubmitError("");
  }, [form, formDefaultValues, onOpenChange]);

  const handleDayClick = useCallback(
    (date: string) => {
      if (!selectionAnchor) {
        setSelectionAnchor(date);
        form.setFieldValue("startDate", date);
        form.setFieldValue("endDate", date);
        return;
      }

      const nextRange = normalizeRange(selectionAnchor, date);
      setSelectionAnchor(null);
      form.setFieldValue("startDate", nextRange.startDate);
      form.setFieldValue("endDate", nextRange.endDate);
    },
    [form, selectionAnchor],
  );

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
          <span className="text-lg font-medium text-ink-gray-8">
            Edit schedule
          </span>
        ),
        size: "sm",
      }}
      actions={
        <div className="-mt-5 flex w-full items-center justify-end gap-2">
          <Button variant="ghost" label="Cancel" onClick={closeModal} />
          <form.Subscribe
            selector={(state) => [state.isDirty, state.isSubmitting] as const}
          >
            {([isDirty, isSubmitting]) => (
              <Button
                variant="solid"
                label="Save changes"
                onClick={() => form.handleSubmit()}
                loading={submitting}
                disabled={!isDirty || isSubmitting || submitting}
              />
            )}
          </form.Subscribe>
        </div>
      }
    >
      <div className="-mt-2 space-y-4">
        <form.Field
          name="startDate"
          children={(startField) => (
            <form.Field
              name="endDate"
              children={(endField) => (
                <div className="space-y-1.5 pl-0.5">
                  <div className="flex items-center justify-between text-base text-ink-gray-5">
                    <span>Select dates to edit</span>
                    <span className="text-right">{headerRangeLabel}</span>
                  </div>

                  <div className="relative overflow-x-auto overflow-y-visible pb-2 no-scrollbar">
                    <div className="flex min-w-fit items-center gap-1 pr-8">
                      {days.map((day) => (
                        <DayChip
                          key={day.date}
                          dayLabel={day.dayLabel}
                          dayNumber={day.dayNumber}
                          monthLabel={day.monthLabel}
                          isMonthBoundary={day.isMonthBoundary}
                          state={
                            normalizedSelection &&
                            day.date >= normalizedSelection.startDate &&
                            day.date <= normalizedSelection.endDate
                              ? "active"
                              : "default"
                          }
                          onClick={() => handleDayClick(day.date)}
                        />
                      ))}
                    </div>
                  </div>

                  {(!startField.state.meta.isValid ||
                    !endField.state.meta.isValid) && (
                    <ErrorMessage
                      message={
                        startField.state.meta.errors[0]?.message ??
                        endField.state.meta.errors[0]?.message
                      }
                    />
                  )}
                </div>
              )}
            />
          )}
        />

        <div className="flex w-full items-start gap-2">
          <form.Field
            name="hoursPerDay"
            children={(field) => (
              <div className="flex-1 space-y-1.5">
                <label className="block text-base text-ink-gray-5">
                  Edit Hours / day
                </label>
                <DurationInput
                  value={field.state.value}
                  variant="compact"
                  onChange={(value) => field.handleChange(value)}
                />
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />

          <div className="flex-1 space-y-1.5">
            <label className="block text-base text-ink-gray-5">
              Total hours
            </label>
            <TextInput
              value={totalHours}
              disabled
              variant="outline"
              size="md"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-base text-ink-gray-5">
            Schedule summary
          </label>

          <div className="overflow-hidden rounded-lg border border-outline-gray-2">
            <table className="w-full table-fixed border-collapse">
              <tbody>
                {previewRows.map((row) => (
                  <tr
                    key={`${row.startDate}_${row.endDate}`}
                    className={cn(
                      "border-b border-outline-gray-2 last:border-b-0 transition-opacity",
                      row.isSelected && "bg-surface-gray-2",
                      row.isSelected && !row.isModified && "opacity-50",
                    )}
                  >
                    <td className="w-1/2 truncate border-r border-outline-gray-2 px-3 py-2.5 text-sm text-ink-gray-6">
                      {formatRange(row.startDate, row.endDate)}
                    </td>
                    <td className="w-1/2 px-3 py-2.5 text-sm">
                      <span className="text-ink-gray-6">
                        {toDisplayHours(row.hoursPerDay)}h/day
                      </span>
                      <span className="text-ink-gray-5">
                        {` · ${toDisplayHours(
                          getRangeHours(
                            row.startDate,
                            row.endDate,
                            row.hoursPerDay,
                          ),
                        )} hours`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {submitError ? <ErrorMessage message={submitError} /> : null}
        </div>
      </div>
    </Dialog>
  );
}

export default EditScheduleModal;
