import { useEffect, useMemo } from "react";
import { DurationInput } from "@next-pms/design-system/components";
import { mergeClassNames as cn } from "@next-pms/design-system/utils";
import {
  Button,
  Dialog,
  Select,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm, useStore } from "@tanstack/react-form";
import { EditScheduleDayGroup } from "./components/day-group";
import { DEFAULT_HOURS_PER_DAY } from "./constants";
import { editScheduleFormSchema } from "./schema";
import type {
  ApplyEditsTo,
  EditScheduleDayCellData,
  EditScheduleModalProps,
  SelectionRange,
} from "./types";
import {
  buildScheduleDaysFromRange,
  getInitialPerDayHours,
  getRecurringInfoLabel,
  getRangeDayIds,
  getScopedTotalHours,
  getSummarySegments,
  isSameRange,
  toRecurringSummaryLabel,
  toRangeLabel,
} from "./utils";

function EditScheduleModal({
  open,
  onOpenChange,
  fromDate,
  toDate,
  initialHoursPerDay,
  recurrence = "one-time",
  repeatFor = 0,
}: EditScheduleModalProps) {
  const toast = useToasts();
  const isRecurring = recurrence === "recurring";
  const scheduleDays = useMemo(
    () => buildScheduleDaysFromRange(fromDate, toDate),
    [fromDate, toDate],
  );
  const defaultHours = initialHoursPerDay ?? DEFAULT_HOURS_PER_DAY;

  const form = useForm({
    defaultValues: {
      selectedDayIds: [] as string[],
      selectionAnchorIndex: null as number | null,
      selectionRange: null as SelectionRange | null,
      perDayHours: getInitialPerDayHours(scheduleDays, defaultHours),
      hoursPerDay: defaultHours,
      applyEditsTo: "this-allocation" as ApplyEditsTo,
    },
    validators: {
      onSubmit: editScheduleFormSchema,
    },
    onSubmit: async ({ value }) => {
      void value;
      toast.success("Schedule updated (static mode)");
      onOpenChange(false);
      form.reset();
    },
  });

  const selectionRange = useStore(
    form.store,
    (state) => state.values.selectionRange,
  );
  const selectionAnchorIndex = useStore(
    form.store,
    (state) => state.values.selectionAnchorIndex,
  );
  const perDayHours = useStore(form.store, (state) => state.values.perDayHours);
  const applyEditsTo = useStore(
    form.store,
    (state) => state.values.applyEditsTo,
  );

  const summarySegments = useMemo(() => {
    return getSummarySegments(
      scheduleDays,
      perDayHours,
      defaultHours,
      selectionRange,
    );
  }, [defaultHours, perDayHours, scheduleDays, selectionRange]);

  const totalHours = useMemo(() => {
    return getScopedTotalHours(
      scheduleDays,
      perDayHours,
      selectionRange,
      defaultHours,
    );
  }, [defaultHours, perDayHours, scheduleDays, selectionRange]);

  const editedDays: EditScheduleDayCellData[] = scheduleDays.map((day) => ({
    ...day,
    interaction: (() => {
      if (!selectionRange) {
        return "default";
      }

      const index = scheduleDays.findIndex((d) => d.id === day.id);
      const { startIndex, endIndex } = selectionRange;

      if (index === startIndex || index === endIndex) {
        return "selected";
      }

      if (index > startIndex && index < endIndex) {
        return "range";
      }

      return "default";
    })(),
  }));

  const dateRangeLabel = scheduleDays.length
    ? toRangeLabel(scheduleDays, 0, scheduleDays.length - 1)
    : "-";
  const recurringInfoLabel = useMemo(
    () => getRecurringInfoLabel(fromDate, repeatFor),
    [fromDate, repeatFor],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldValue("selectedDayIds", []);
    form.setFieldValue("selectionAnchorIndex", null);
    form.setFieldValue("selectionRange", null);
    form.setFieldValue(
      "perDayHours",
      getInitialPerDayHours(scheduleDays, defaultHours),
    );
    form.setFieldValue("hoursPerDay", defaultHours);
  }, [defaultHours, form, open, scheduleDays]);

  const handleDayClick = (id: string) => {
    const clickedIndex = scheduleDays.findIndex((day) => day.id === id);
    if (clickedIndex < 0) {
      return;
    }

    if (
      selectionAnchorIndex !== null &&
      selectionAnchorIndex !== clickedIndex
    ) {
      const nextRange = {
        startIndex: Math.min(selectionAnchorIndex, clickedIndex),
        endIndex: Math.max(selectionAnchorIndex, clickedIndex),
      };
      const nextDayIds = getRangeDayIds(scheduleDays, nextRange);

      form.setFieldValue("selectionRange", nextRange);
      form.setFieldValue("selectedDayIds", nextDayIds);
      form.setFieldValue("selectionAnchorIndex", null);
      form.setFieldValue("hoursPerDay", 0);
      return;
    }

    const currentDayHours = perDayHours[id];
    const singleDayHours = Number.isFinite(currentDayHours)
      ? currentDayHours
      : defaultHours;

    // First click (or restart): select a single day and make it the active anchor.
    form.setFieldValue("selectionAnchorIndex", clickedIndex);
    form.setFieldValue("selectionRange", {
      startIndex: clickedIndex,
      endIndex: clickedIndex,
    });
    form.setFieldValue("selectedDayIds", [id]);
    form.setFieldValue("hoursPerDay", singleDayHours);
  };

  const handleHoursChange = (value: number) => {
    const nextHours = Math.max(0, value);
    form.setFieldValue("hoursPerDay", nextHours);
    // Once hours are modified, further day clicks should start a fresh selection.
    form.setFieldValue("selectionAnchorIndex", null);

    if (!selectionRange) {
      const nextMap = scheduleDays.reduce<Record<string, number>>(
        (acc, day) => {
          acc[day.id] = nextHours;
          return acc;
        },
        {},
      );
      form.setFieldValue("perDayHours", nextMap);
      return;
    }

    const rangeDayIds = getRangeDayIds(scheduleDays, selectionRange);
    const nextMap = { ...perDayHours };
    rangeDayIds.forEach((dayId) => {
      nextMap[dayId] = nextHours;
    });

    form.setFieldValue("perDayHours", nextMap);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          form.reset();
        }
      }}
      options={{
        title: "Edit Schedule",
      }}
      actions={
        <div className="flex items-center justify-end w-full gap-2 -mt-2">
          <Button
            variant="ghost"
            label="Cancel"
            onClick={() => onOpenChange(false)}
          />
          <Button
            variant="solid"
            label="Save changes"
            onClick={() => form.handleSubmit()}
          />
        </div>
      }
    >
      <div className="-mt-1 space-y-4">
        {!scheduleDays.length ? (
          <p className="text-base text-ink-gray-6">
            No dates available to edit for this allocation.
          </p>
        ) : null}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-base text-ink-gray-6">
              Select dates to edit
            </label>
            <p className="text-base text-ink-gray-6">{dateRangeLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <EditScheduleDayGroup
                days={editedDays}
                onDayClick={handleDayClick}
                className="max-w-full"
              />
            </div>
            {isRecurring && recurringInfoLabel ? (
              <p className="text-sm text-ink-gray-5 shrink-0 text-right">
                {recurringInfoLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2.5">
          <form.Field
            name="hoursPerDay"
            children={(field) => (
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="block text-base text-ink-gray-6">
                  Edit hours / day
                </label>
                <DurationInput
                  value={field.state.value}
                  onChange={(value) => handleHoursChange(value)}
                  variant="compact"
                />
              </div>
            )}
          />
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="block text-base text-ink-gray-6">
              Edit total hours
            </label>
            <TextInput
              size="md"
              value={totalHours}
              variant="outline"
              disabled={true}
            />
          </div>
        </div>

        {isRecurring ? (
          <div className="space-y-1.5">
            <label className="block text-base text-ink-gray-6">
              Apply edits to
            </label>
            <Select
              value={applyEditsTo}
              onChange={(value) =>
                form.setFieldValue("applyEditsTo", value as ApplyEditsTo)
              }
              variant="outline"
              className="h-8"
              options={[
                { label: "This allocation", value: "this-allocation" },
                { label: "This and future", value: "this-and-future" },
                { label: "All occurrences", value: "all-occurrences" },
              ]}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label className="block text-base text-ink-gray-6">
            Schedule summary
          </label>
          <div className="overflow-hidden border rounded-lg border-outline-gray-2">
            {summarySegments.map((segment, rowIndex) => {
              const rangeHours = Math.round(
                segment.daysCount * segment.hoursPerDay,
              );
              const baseRowLabel = toRangeLabel(
                scheduleDays,
                segment.startIndex,
                segment.endIndex,
              );
              const rowLabel = isRecurring
                ? toRecurringSummaryLabel(
                    baseRowLabel,
                    rowIndex,
                    summarySegments.length,
                    repeatFor,
                  )
                : baseRowLabel;
              const rowRange: SelectionRange = {
                startIndex: segment.startIndex,
                endIndex: segment.endIndex,
              };
              const isActiveRow = isSameRange(selectionRange, rowRange);

              return (
                <div
                  key={rowLabel}
                  className="grid grid-cols-2 cursor-pointer"
                  onClick={() => {
                    form.setFieldValue("selectionRange", rowRange);
                    form.setFieldValue("selectionAnchorIndex", null);
                    form.setFieldValue(
                      "selectedDayIds",
                      getRangeDayIds(scheduleDays, rowRange),
                    );
                    form.setFieldValue("hoursPerDay", segment.hoursPerDay);
                  }}
                >
                  <div
                    className={cn(
                      "px-3 py-2.5 text-base text-ink-gray-7 border-r border-outline-gray-2",
                      isActiveRow ? "bg-surface-gray-3" : "bg-surface-white",
                    )}
                  >
                    {rowLabel}
                  </div>
                  <div
                    className={cn(
                      "px-3 py-2.5 text-base text-ink-gray-6",
                      isActiveRow ? "bg-surface-gray-3" : "bg-surface-white",
                    )}
                  >
                    {segment.hoursPerDay}h/day · {rangeHours} hours
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export default EditScheduleModal;
