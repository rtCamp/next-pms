import {
  computed,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import { useCall } from "frappe-ui";
import { OVER_ALLOCATION_DEBOUNCE_MS } from "./constants";

/** A day the allocation would book more than the employee has. */
export interface OverAllocatedDay {
  date: string;
  excessHours: number;
}

interface OverAllocationResponse {
  dates?: { date: string; excess_hours: number }[];
}

type OverAllocationParams = {
  employee: string;
  start_date: string;
  end_date: string;
  hours_per_day: number;
  include_weekends: number;
  include_holidays: number;
  repeat_till_week_count: number;
  allocation_name?: string;
};

/**
 * The days a proposed allocation over-allocates the employee
 * (`get_over_allocated_dates`), checked 500 ms after the inputs stop changing. The
 * allocation being edited is left out of the existing hours.
 */
export function useOverAllocation(
  input: MaybeRefOrGetter<{
    enabled: boolean;
    employeeId: string;
    fromDate: string;
    toDate: string;
    hoursPerDay: number;
    includeWeekends: boolean;
    includeHolidays: boolean;
    /** Extra weekly copies saved with it; 0 for one-time or an edit. */
    repeatWeeks: number;
    allocationId?: string;
  }>,
) {
  const call = useCall<OverAllocationResponse, OverAllocationParams>({
    url: "/api/v2/method/next_pms.resource_management.api.allocation.get_over_allocated_dates",
    immediate: false,
  });

  const params = computed<OverAllocationParams | null>(() => {
    const value = toValue(input);
    if (
      !value.enabled ||
      !value.employeeId ||
      !value.fromDate ||
      !value.toDate ||
      value.fromDate > value.toDate ||
      !(value.hoursPerDay > 0)
    ) {
      return null;
    }
    return {
      employee: value.employeeId,
      start_date: value.fromDate,
      end_date: value.toDate,
      hours_per_day: value.hoursPerDay,
      include_weekends: value.includeWeekends ? 1 : 0,
      include_holidays: value.includeHolidays ? 1 : 0,
      repeat_till_week_count: value.repeatWeeks,
      ...(value.allocationId ? { allocation_name: value.allocationId } : {}),
    };
  });
  const key = computed(() => JSON.stringify(params.value));
  const answer = shallowRef<{ key: string; days: OverAllocatedDay[] } | null>(
    null,
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(
    key,
    (requestKey) => {
      clearTimeout(timer);
      const request = params.value;
      if (!request) return;
      timer = setTimeout(async () => {
        const response = await call.submit(request).catch(() => null);
        if (response && requestKey === key.value) {
          answer.value = {
            key: requestKey,
            days: (response.dates ?? []).map((day) => ({
              date: day.date,
              excessHours: day.excess_hours,
            })),
          };
        }
      }, OVER_ALLOCATION_DEBOUNCE_MS);
    },
    { immediate: true },
  );
  onScopeDispose(() => clearTimeout(timer));

  return computed<OverAllocatedDay[]>(() =>
    params.value && answer.value?.key === key.value ? answer.value.days : [],
  );
}
