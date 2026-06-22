/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Dialog, Select, useToasts } from "@rtcamp/frappe-ui-react";
import { useForm, useStore } from "@tanstack/react-form";
import { format, parseISO } from "date-fns";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { buildScheduleSelectionOverridePatch } from "@/pages/allocations/overrideEdit";
import { propagationModeLabels } from "../add-allocation/constants";
import ScheduleDateSelectionField from "./components/scheduleDateSelectionField";
import ScheduleHoursPerDayField from "./components/scheduleHoursPerDayField";
import ScheduleSummaryTable from "./components/scheduleSummaryTable";
import ScheduleTotalHoursField from "./components/scheduleTotalHoursField";
import { useScheduleFieldGroup } from "./scheduleFieldGroup";
import { editScheduleFormSchema, type EditScheduleFormValues } from "./schema";
import type { EditScheduleApplyMode, EditScheduleModalProps } from "./types";
import { buildDays, buildScheduleDraft, normalizeRange } from "./utils";

const EDIT_SCHEDULE_APPLY_MODES = new Set<EditScheduleApplyMode>([
  "only_this",
  "this_and_future",
  "whole_series",
]);

function isEditScheduleApplyMode(
  value: string,
): value is EditScheduleApplyMode {
  return EDIT_SCHEDULE_APPLY_MODES.has(value as EditScheduleApplyMode);
}

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
    () => normalizeRange(safeValues.rangeStart, safeValues.rangeEnd),
    [safeValues.rangeEnd, safeValues.rangeStart],
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

  const formDefaultValues = useMemo<EditScheduleFormValues>(
    () => ({
      schedule: {
        selection: {
          startDate: "",
          endDate: "",
        },
        input: {
          value: defaultHoursPerDay,
          mode: "hoursPerDay",
        },
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
      const scheduleDraft = buildScheduleDraft({
        rangeStart: fullRange.startDate,
        rangeEnd: fullRange.endDate,
        defaultHoursPerDay,
        override: safeValues.override,
        schedule: value.schedule,
      });
      const scheduleSelectionOverridePatch = scheduleDraft.selection
        ? buildScheduleSelectionOverridePatch({
            allocation: allocationContext,
            next: {
              startDate: scheduleDraft.selection.startDate,
              endDate: scheduleDraft.selection.endDate,
              hoursPerDay: scheduleDraft.hoursPerDay,
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
          day_overrides: scheduleSelectionOverridePatch.dayOverrides,
          deleted_day_overrides:
            scheduleSelectionOverridePatch.deletedDayOverrides,
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

  const scheduleGroup = useScheduleFieldGroup(form as never);
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
      schedule,
      safeValues.override,
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
          <span className="text-lg font-medium text-ink-gray-8">
            Edit schedule
          </span>
        ),
        size: "sm",
      }}
      actions={
        <div className="-mt-5 flex w-full items-center justify-end gap-2">
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
    >
      <div className="-mt-2 space-y-4">
        <ScheduleDateSelectionField
          group={scheduleGroup}
          days={days}
          headerRangeLabel={scheduleDraft.headerRangeLabel}
          recurrenceHelperText={recurrenceHelperText}
          selection={scheduleDraft.selection}
          selectionAnchor={selectionAnchor}
          setSelectionAnchor={setSelectionAnchor}
        />

        <div className="flex w-full items-start gap-2">
          <ScheduleHoursPerDayField
            group={scheduleGroup}
            scheduleDraft={scheduleDraft}
          />
          <ScheduleTotalHoursField
            group={scheduleGroup}
            scheduleDraft={scheduleDraft}
          />
        </div>

        {isRecurringAllocation ? (
          <div className="space-y-1.5">
            <label className="block text-base text-ink-gray-5">
              Apply edits to
            </label>
            <Select
              value={applyMode}
              options={[
                {
                  value: "only_this",
                  label: propagationModeLabels.only_this,
                },
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
          <ScheduleSummaryTable rows={scheduleDraft.previewRows} />
        </div>
      </div>
    </Dialog>
  );
}

export default EditScheduleModal;
