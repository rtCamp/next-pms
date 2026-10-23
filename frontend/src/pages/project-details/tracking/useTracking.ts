import { computed, inject, provide, type InjectionKey } from "vue";
import { useCall } from "frappe-ui";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { formatCurrency } from "@/utils/format";
import { TRACKING_METHOD } from "./constants";
import type { Tracking } from "./types";

function createTracking() {
  const { projectId, doc } = useProjectDetails();

  const call = useCall<Tracking, { project: string }>({
    url: TRACKING_METHOD,
    params: () => ({ project: projectId.value }),
    refetch: true,
  });

  const currency = computed(() => doc.value?.custom_currency);

  return {
    tracking: computed(() => call.data),
    loading: computed(() => call.loading && !call.data),
    error: computed(() => call.error),
    reload: () => call.reload(),
    /** An amount in the project's currency. */
    money: (value: number, currencyCode?: string | null) =>
      formatCurrency(value, currencyCode ?? currency.value),
  };
}

export type TrackingState = ReturnType<typeof createTracking>;

const trackingKey: InjectionKey<TrackingState> = Symbol("tracking");

/** Loads the project's tracking data and provides it to the widgets. */
export function provideTracking(): TrackingState {
  const state = createTracking();
  provide(trackingKey, state);
  return state;
}

/** The tracking data provided by the Tracking tab. */
export function useTracking(): TrackingState {
  const state = inject(trackingKey);
  if (!state)
    throw new Error("useTracking() needs provideTracking() in a parent");
  return state;
}
