import { computed, reactive } from "vue";
import { useCall } from "frappe-ui";
import { DEFAULT_AUTO_EXPAND_WEEKS } from "./constants";

interface PmsSettings {
  auto_expand_weeks_by_default: number | null;
  use_system_auto_expand_weeks: boolean | number;
  system_auto_expand_weeks_by_default: number;
}

/** How many weeks a timesheet page opens expanded, from the user's PMS settings. */
export function useExpandedWeeks() {
  const settings = useCall<PmsSettings>({
    url: "/api/v2/method/next_pms.next_pms.doctype.pms_user_setting.pms_user_setting.get_pms_settings",
  });

  const count = computed(() => {
    const data = settings.data;
    if (data?.use_system_auto_expand_weeks) {
      return data.system_auto_expand_weeks_by_default;
    }
    return data?.auto_expand_weeks_by_default ?? DEFAULT_AUTO_EXPAND_WEEKS;
  });

  return reactive({ count, loading: computed(() => settings.loading) });
}
