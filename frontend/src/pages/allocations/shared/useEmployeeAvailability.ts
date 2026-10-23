import {
  computed,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import { useCall } from "frappe-ui";
import type { AvailabilityByDate } from "./types";

interface AvailabilityResponse {
  dates?: Record<
    string,
    {
      availability_factor: number;
      is_holiday: boolean;
      holiday_name?: string;
    }
  >;
}

type AvailabilityParams = {
  employee: string;
  start_date: string;
  end_date: string;
  include_weekends: number;
};

/**
 * The days in a range the employee isn't fully available (leave, holidays), keyed by
 * date (`get_employee_availability`); days left out are full working days.
 */
export function useEmployeeAvailability(options: {
  employeeId: MaybeRefOrGetter<string>;
  startDate: MaybeRefOrGetter<string>;
  endDate: MaybeRefOrGetter<string>;
  includeWeekends: MaybeRefOrGetter<boolean>;
  enabled: MaybeRefOrGetter<boolean>;
}) {
  const call = useCall<AvailabilityResponse, AvailabilityParams>({
    url: "/api/v2/method/next_pms.resource_management.api.allocation.get_employee_availability",
    immediate: false,
  });
  const params = computed<AvailabilityParams | null>(() => {
    const employee = toValue(options.employeeId);
    const start = toValue(options.startDate);
    const end = toValue(options.endDate);
    if (!toValue(options.enabled) || !employee || !start || !end) return null;
    if (start > end) return null;
    return {
      employee,
      start_date: start,
      end_date: end,
      include_weekends: toValue(options.includeWeekends) ? 1 : 0,
    };
  });
  const key = computed(() => JSON.stringify(params.value));
  const answer = shallowRef<{
    key: string;
    response: AvailabilityResponse;
  } | null>(null);

  watch(
    key,
    async (requestKey) => {
      if (!params.value) return;
      const response = await call.submit(params.value).catch(() => null);
      if (response && requestKey === key.value) {
        answer.value = { key: requestKey, response };
      }
    },
    { immediate: true },
  );

  return computed<AvailabilityByDate>(() => {
    if (!params.value || answer.value?.key !== key.value) return {};
    return Object.fromEntries(
      Object.entries(answer.value.response.dates ?? {}).map(([date, day]) => [
        date,
        {
          availabilityFactor: day.availability_factor,
          isHoliday: day.is_holiday,
          ...(day.holiday_name ? { holidayName: day.holiday_name } : {}),
        },
      ]),
    );
  });
}
