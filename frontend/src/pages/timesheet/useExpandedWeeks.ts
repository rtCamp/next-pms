import { computed, reactive } from "vue";
import { usePmsSettings } from "@/composables/usePmsSettings";
import { DEFAULT_AUTO_EXPAND_WEEKS } from "./constants";

/** How many weeks a timesheet page opens expanded, from the user's PMS settings. */
export function useExpandedWeeks() {
  const settings = usePmsSettings();
  settings.load();

  const count = computed(() => {
    const data = settings.data;
    if (data?.use_system_auto_expand_weeks) {
      return data.system_auto_expand_weeks_by_default;
    }
    return data?.auto_expand_weeks_by_default ?? DEFAULT_AUTO_EXPAND_WEEKS;
  });

  return reactive({ count, loading: computed(() => settings.loading) });
}
