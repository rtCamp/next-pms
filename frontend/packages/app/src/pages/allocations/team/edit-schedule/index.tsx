/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Dialog, Select, useToasts } from "@rtcamp/frappe-ui-react";
import { useForm, useStore } from "@tanstack/react-form";
import { format, parseISO } from "date-fns";
import {
  FrappeError,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { propagationModeLabels } from "@/pages/allocations/constants";
import { buildScheduleSelectionOverridePatch } from "@/pages/allocations/overrideUtils";
import ScheduleDateSelectionField from "./components/scheduleDateSelectionField";
import ScheduleHoursPerDayField from "./components/scheduleHoursPerDayField";
import ScheduleSummaryTable from "./components/scheduleSummaryTable";
import ScheduleTotalHoursField from "./components/scheduleTotalHoursField";
import { editScheduleFormSchema, type EditScheduleFormValues } from "./schema";
import type { EditScheduleApplyMode, EditScheduleModalProps } from "./types";
import {
  buildDays,
  buildScheduleDraft,
  getErrorMessage,
  isEditScheduleApplyMode,
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
  const [applyMode, setApplyMode] =
    useState<EditScheduleApplyMode>("this_and_future");

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
  const { data: seriesData } = useFrappeGetCall<{
    message: { remaining_weeks: number; series_end_date: string };
  }>(
    "next_pms.resource_management.api.allocation.get_series_remaining_weeks",
    { name: safeValues.allocationName },
    open && isRecurringAllocation && safeValues.allocationName
      ? undefined
      : false,
  );
  const recurrenceHelperText = useMemo(() => {
    const series = seriesData?.message;
    if (
      !isRecurringAllocation ||
      applyMode === "only_this" ||
      !series?.series_end_date
    ) {
      return undefined;
    }

    return `Repeats for ${series.remaining_weeks} week${series.remaining_weeks === 1 ? "" : "s"} till ${format(parseISO(series.series_end_date), "MMM d")}`;
  }, [applyMode, isRecurringAllocation, seriesData]);

  const summaryRepeatWeeks =
    isRecurringAllocation &&
    applyMode !== "only_this" &&
    seriesData?.message?.remaining_weeks
      ? Math.max(0, seriesData.message.remaining_weeks - 1)
      : 0;

  const days = useMemo(
    () => buildDays(fullRange.startDate, fullRange.endDate),
    [fullRange.endDate, fullRange.startDate],
  );

  const formDefaultValues = useMemo<EditScheduleFormValues>(
    () => ({
      schedule: {
        selection: { startDate: "", endDate: "" },
        input: { value: defaultHoursPerDay, mode: "hoursPerDay" },
      },
    }),
    [defaultHoursPerDay],
  );

  const form = useForm({
    defaultValues: formDefaultValues,
    validators: {
      onChange: editScheduleFormSchema,
      onSubmit: editScheduleFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!initialValues?.allocationName) {
        return;
      }
      const allocationContext = {
        allocationStartDate:
          initialValues.allocationStartDate ?? initialValues.rangeStart,
        allocationEndDate:
          initialValues.allocationEndDate ?? initialValues.rangeEnd,
        allocationHoursPerDay:
          initialValues.allocationHoursPerDay ??
          initialValues.defaultHoursPerDay,
        override: initialValues.override,
      };
      const draft = buildScheduleDraft({
        rangeStart: fullRange.startDate,
        rangeEnd: fullRange.endDate,
        defaultHoursPerDay,
        override: safeValues.override,
        schedule: value.schedule,
      });
      const patch = draft.selection
        ? buildScheduleSelectionOverridePatch({
            allocation: allocationContext,
            next: {
              startDate: draft.selection.startDate,
              endDate: draft.selection.endDate,
              hoursPerDay: draft.hoursPerDay,
            },
          })
        : { dayOverrides: [], deletedDayOverrides: [] };

      try {
        setSubmitting(true);
        await editAllocation({
          name: initialValues.allocationName,
          edit_mode: isRecurringAllocation ? applyMode : "only_this",
          allocation: {
            doctype: "Resource Allocation",
            employee: initialValues.employeeId ?? "",
            project: initialValues.projectId ?? null,
            customer: initialValues.customer ?? "",
            allocation_start_date: allocationContext.allocationStartDate,
            allocation_end_date: allocationContext.allocationEndDate,
            hours_allocated_per_day: allocationContext.allocationHoursPerDay,
            include_weekends: true,
            is_billable: Number(initialValues.isBillable ?? true),
            status: initialValues.isTentative ? "Tentative" : "Confirmed",
            note: initialValues.note ?? "",
          },
          day_overrides: patch.dayOverrides,
          deleted_day_overrides: patch.deletedDayOverrides,
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
        toast.error(parseFrappeErrorMsg(error as FrappeError));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const schedule = useStore(form.store, (state) => state.values.schedule);
  const scheduleDraft = useMemo(
    () =>
      buildScheduleDraft({
        rangeStart: fullRange.startDate,
        rangeEnd: fullRange.endDate,
        defaultHoursPerDay,
        override: safeValues.override,
        schedule,
      }),
    [
      defaultHoursPerDay,
      fullRange.endDate,
      fullRange.startDate,
      safeValues.override,
      schedule,
    ],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(formDefaultValues);
    setSelectionAnchor(null);
    setApplyMode("this_and_future");
  }, [form, formDefaultValues, open]);

  const closeModal = useCallback(() => {
    onOpenChange(false);
    form.reset(formDefaultValues);
    setSelectionAnchor(null);
    setApplyMode("this_and_future");
  }, [form, formDefaultValues, onOpenChange]);

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
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                variant="solid"
                label="Save changes"
                onClick={() => form.handleSubmit()}
                loading={submitting}
                disabled={
                  !scheduleDraft.hasMeaningfulChange ||
                  isSubmitting ||
                  submitting
                }
              />
            )}
          </form.Subscribe>
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
        <form.Field name="schedule.selection.startDate">
          {(startField) => (
            <form.Field name="schedule.selection.endDate">
              {(endField) => (
                <ScheduleDateSelectionField
                  days={days}
                  headerRangeLabel={scheduleDraft.headerRangeLabel}
                  recurrenceHelperText={recurrenceHelperText}
                  selection={scheduleDraft.selection}
                  onDayClick={(date) => {
                    if (!selectionAnchor) {
                      setSelectionAnchor(date);
                      startField.handleChange(date);
                      endField.handleChange(date);
                      return;
                    }

                    const next = normalizeRange(selectionAnchor, date);
                    setSelectionAnchor(null);
                    startField.handleChange(next.startDate);
                    endField.handleChange(next.endDate);
                  }}
                  error={
                    getErrorMessage(startField.state.meta.errors[0]) ??
                    getErrorMessage(endField.state.meta.errors[0])
                  }
                />
              )}
            </form.Field>
          )}
        </form.Field>

        <div className="flex w-full items-start gap-2 pb-1.5">
          <form.Field name="schedule.input.value">
            {(field) => (
              <ScheduleHoursPerDayField
                value={scheduleDraft.hoursPerDay}
                disabled={!scheduleDraft.hasSelection}
                onChange={(value) => {
                  form.setFieldValue("schedule.input.mode", "hoursPerDay");
                  field.handleChange(value);
                }}
                error={
                  schedule.input.mode === "hoursPerDay"
                    ? getErrorMessage(field.state.meta.errors[0])
                    : undefined
                }
              />
            )}
          </form.Field>
          <form.Field name="schedule.input.value">
            {(field) => (
              <ScheduleTotalHoursField
                value={
                  scheduleDraft.hasSelection
                    ? toDisplayHours(scheduleDraft.totalHours)
                    : ""
                }
                disabled={!scheduleDraft.hasSelection}
                onChange={(value) => {
                  form.setFieldValue("schedule.input.mode", "totalHours");
                  field.handleChange(value);
                }}
                error={
                  schedule.input.mode === "totalHours"
                    ? getErrorMessage(field.state.meta.errors[0])
                    : undefined
                }
              />
            )}
          </form.Field>
        </div>

        {isRecurringAllocation ? (
          <div className="space-y-1.5">
            <label className="block text-base text-ink-gray-5">
              Apply edits to
            </label>
            <Select
              value={applyMode}
              options={[
                { value: "only_this", label: propagationModeLabels.only_this },
                {
                  value: "this_and_future",
                  label: propagationModeLabels.this_and_future,
                },
                {
                  value: "whole_series",
                  label: propagationModeLabels.whole_series,
                },
              ]}
              onChange={(value) => {
                if (value && isEditScheduleApplyMode(value)) {
                  setApplyMode(value);
                }
              }}
              variant="outline"
              size="md"
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label className="block text-base text-ink-gray-5">
            Schedule summary
          </label>
          <ScheduleSummaryTable
            rows={scheduleDraft.previewRows}
            repeatWeeks={summaryRepeatWeeks}
          />
        </div>
      </div>
    </Dialog>
  );
}

export default EditScheduleModal;
