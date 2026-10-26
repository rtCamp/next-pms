import { computed, reactive } from "vue";
import { useCall } from "frappe-ui";

const PMS_SETTINGS_API =
  "/api/v2/method/next_pms.next_pms.doctype.pms_user_setting.pms_user_setting";

export interface PmsSettings {
  auto_expand_weeks_by_default: number | null;
  use_system_auto_expand_weeks: boolean | number;
  system_auto_expand_weeks_by_default: number;
}

export type PmsSettingsUpdate = Pick<
  PmsSettings,
  "auto_expand_weeks_by_default" | "use_system_auto_expand_weeks"
>;

function createPmsSettings() {
  let loading: Promise<void> | undefined;
  const settings = useCall<PmsSettings>({
    url: `${PMS_SETTINGS_API}.get_pms_settings`,
    immediate: false,
  });
  const update = useCall<null, { settings: PmsSettingsUpdate }>({
    url: `${PMS_SETTINGS_API}.update_pms_settings`,
    method: "POST",
    immediate: false,
  });

  return reactive({
    data: computed(() => settings.data ?? null),
    loading: computed(() => settings.loading),
    error: computed(() => settings.error),
    saving: computed(() => update.loading),
    /** Loads the settings once; later calls reuse the first load. */
    load() {
      loading ??= settings.fetch().then(() => {
        // A failed load may be retried by the next reader.
        if (settings.error) loading = undefined;
      });
      return loading;
    },
    /** Saves the user's own settings, then reloads them for every reader. */
    async save(values: PmsSettingsUpdate) {
      await update.submit({ settings: values });
      await settings.reload();
    },
  });
}

let pmsSettings: ReturnType<typeof createPmsSettings> | undefined;

/**
 * The signed-in user's PMS settings (`PMS User Setting`), shared app-wide so a save in
 * Settings reaches an open timesheet. Call `load()` before reading.
 */
export function usePmsSettings() {
  pmsSettings ??= createPmsSettings();
  return pmsSettings;
}
