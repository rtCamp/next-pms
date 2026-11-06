import { computed, reactive, ref, shallowRef, watch } from "vue";
import { dayjs, toast, useCall } from "frappe-ui";
import { errorMessage } from "@/utils/errors";
import type { AllocationPayload, EditScheduleRequest } from "./allocationForm";
import { buildSchedulePayload, type SchedulePayload } from "./overrides";
import {
  buildScheduleDays,
  buildScheduleDraft,
  lockedScheduleDates,
  normalizeRange,
  seedHoursPerDay,
  type ScheduleInput,
} from "./schedule";
import type { AllocationDialogs } from "./useAllocationDialogs";
import { useEmployeeAvailability } from "./useEmployeeAvailability";

export type ScheduleApplyMode = "only_this" | "this_and_future";

export const APPLY_MODE_OPTIONS: { label: string; value: ScheduleApplyMode }[] =
  [
    { label: "This allocation", value: "only_this" },
    { label: "This and future", value: "this_and_future" },
  ];

interface SeriesResponse {
  occurrences: { allocation_end_date: string }[];
  picked_index: number;
}

type EditParams = {
  name: string;
  edit_mode: ScheduleApplyMode;
  allocation: AllocationPayload;
  day_overrides: SchedulePayload["dayOverrides"];
  deleted_day_overrides: string[];
};

/**
 * The Edit schedule dialog's state: the days picked in the strip, the hours typed (per
 * day or as a total), the summary, the apply mode of a recurring allocation, and the save
 * as day overrides or new hours per day.
 */
export function useEditSchedule(dialogs: AllocationDialogs) {
  const open = computed(() => dialogs.schedule.open);
  const request = computed<EditScheduleRequest | null>(
    () => dialogs.schedule.request,
  );

  const input = reactive<ScheduleInput>({
    selection: [],
    value: 0,
    mode: "hoursPerDay",
  });
  const applyMode = ref<ScheduleApplyMode>("only_this");
  /** Errors show from the first save on, then follow every change. */
  const submitted = ref(false);
  const submitting = ref(false);

  watch(
    open,
    (isOpen) => {
      if (!isOpen) return;
      input.selection = [];
      input.value = request.value?.hoursPerDay ?? 0;
      input.mode = "hoursPerDay";
      applyMode.value = "only_this";
      submitted.value = false;
    },
    { immediate: true },
  );

  const range = computed(() => {
    const today = dayjs().format("YYYY-MM-DD");
    const start = request.value?.rangeStart || today;
    return normalizeRange(start, request.value?.rangeEnd || start);
  });
  const includeWeekends = computed(() =>
    Boolean(request.value?.includeWeekends),
  );
  const includeHolidays = computed(() =>
    Boolean(request.value?.includeHolidays),
  );
  const isRecurring = computed(() => Boolean(request.value?.recurrenceId));

  const availability = useEmployeeAvailability({
    employeeId: () => request.value?.employeeId ?? "",
    startDate: () => range.value.startDate,
    endDate: () => range.value.endDate,
    includeWeekends,
    enabled: open,
  });
  const lockedDates = computed(() =>
    lockedScheduleDates(availability.value, includeHolidays.value, {
      ...range.value,
      includeWeekends: includeWeekends.value,
    }),
  );
  const days = computed(() =>
    buildScheduleDays(
      range.value.startDate,
      range.value.endDate,
      availability.value,
      lockedDates.value,
    ),
  );

  const series = useCall<SeriesResponse, { name: string }>({
    url: "/api/v2/method/next_pms.resource_management.api.allocation.get_allocation_series",
    immediate: false,
  });
  const seriesInfo = shallowRef<{ weeks: number; endDate: string } | null>(
    null,
  );
  watch(
    [open, () => request.value?.allocationId],
    async ([isOpen, allocationId]) => {
      seriesInfo.value = null;
      if (!isOpen || !allocationId || !isRecurring.value) return;
      const response = await series
        .submit({ name: allocationId })
        .catch(() => null);
      const remaining = response?.occurrences.slice(response.picked_index);
      const last = remaining?.at(-1);
      if (remaining && last && request.value?.allocationId === allocationId) {
        seriesInfo.value = {
          weeks: remaining.length,
          endDate: last.allocation_end_date,
        };
      }
    },
    { immediate: true },
  );
  const recurrenceHelperText = computed(() => {
    if (!isRecurring.value || applyMode.value === "only_this") return "";
    const info = seriesInfo.value;
    if (!info) return "";
    return `Repeats for ${info.weeks} week${info.weeks === 1 ? "" : "s"} till ${dayjs(info.endDate).format("MMM D")}`;
  });

  const context = computed(() => ({
    rangeStart: range.value.startDate,
    rangeEnd: range.value.endDate,
    defaultHoursPerDay: request.value?.hoursPerDay ?? 0,
    override: request.value?.override,
    availability: availability.value,
    lockedDates: lockedDates.value,
    includeHolidays: includeHolidays.value,
    includeWeekends: includeWeekends.value,
  }));
  const draft = computed(() => buildScheduleDraft({ ...context.value, input }));
  const allocationSchedule = computed(() => ({
    allocationStartDate: range.value.startDate,
    allocationEndDate: range.value.endDate,
    allocationHoursPerDay: request.value?.hoursPerDay ?? 0,
    override: request.value?.override,
  }));
  const payload = computed<SchedulePayload>(() =>
    draft.value.hasSelection
      ? buildSchedulePayload(allocationSchedule.value, {
          dates: draft.value.selection,
          hoursPerDay: draft.value.hoursPerDay,
          lockedDates: lockedDates.value,
        })
      : {
          allocationHoursPerDay: allocationSchedule.value.allocationHoursPerDay,
          dayOverrides: [],
          deletedDayOverrides: [],
        },
  );
  const hasChange = computed(
    () =>
      payload.value.dayOverrides.length > 0 ||
      payload.value.deletedDayOverrides.length > 0 ||
      payload.value.allocationHoursPerDay !==
        allocationSchedule.value.allocationHoursPerDay,
  );

  const errors = computed(() => {
    if (!submitted.value) return { selection: "", value: "" };
    return {
      selection: input.selection.length ? "" : "Please select a date.",
      value:
        !Number.isFinite(input.value) || input.value < 0
          ? "Must be greater than or equal to 0."
          : draft.value.hasSelection && !hasChange.value
            ? "Update hours first."
            : "",
    };
  });

  function toggleDay(date: string) {
    const next = input.selection.includes(date)
      ? input.selection.filter((selected) => selected !== date)
      : [...input.selection, date];
    input.selection = next;
    input.mode = "hoursPerDay";
    input.value = seedHoursPerDay({
      dates: next,
      anchorDate: date,
      defaultHoursPerDay: request.value?.hoursPerDay ?? 0,
      override: request.value?.override,
      lockedDates: lockedDates.value,
    });
  }

  function setHoursPerDay(value: number) {
    input.mode = "hoursPerDay";
    input.value = value;
  }

  function setTotalHours(value: string | number) {
    const parsed = Number(value);
    input.mode = "totalHours";
    input.value = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  const editCall = useCall<unknown, EditParams>({
    url: "/api/v2/method/next_pms.resource_management.api.allocation.edit_allocation",
    method: "POST",
    immediate: false,
  });

  function close() {
    dialogs.schedule.open = false;
  }

  async function submit() {
    submitted.value = true;
    const current = request.value;
    if (!current?.allocationId) return;
    if (errors.value.selection || errors.value.value) return;
    const schedule = payload.value;
    submitting.value = true;
    try {
      await dialogs.runWrite(async () => {
        await editCall.submit({
          name: current.allocationId,
          edit_mode: isRecurring.value ? applyMode.value : "only_this",
          allocation: {
            doctype: "Resource Allocation",
            employee: current.employeeId,
            project: current.projectId || null,
            customer: current.customerId,
            allocation_start_date: range.value.startDate,
            allocation_end_date: range.value.endDate,
            hours_allocated_per_day: schedule.allocationHoursPerDay,
            include_weekends: current.includeWeekends,
            include_holidays: current.includeHolidays,
            is_billable: Number(current.isBillable),
            status: current.isTentative ? "Tentative" : "Confirmed",
            note: current.note,
          },
          day_overrides: schedule.dayOverrides,
          deleted_day_overrides: schedule.deletedDayOverrides,
        });
        await dialogs.refresh(current.refreshTargets);
        toast.success("Schedule updated.");
        close();
      });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      submitting.value = false;
    }
  }

  return reactive({
    open,
    request,
    input,
    applyMode,
    isRecurring,
    includeWeekends,
    includeHolidays,
    days,
    draft,
    errors,
    recurrenceHelperText,
    submitting,
    toggleDay,
    setHoursPerDay,
    setTotalHours,
    submit,
    close,
  });
}
