import { computed, effectScope, reactive } from "vue";
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
    /** Fetches the settings again, e.g. after a system default changed. */
    reload: () => settings.reload(),
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
 * Settings reaches an open timesheet. Call `reload()` before reading.
 */
export function usePmsSettings() {
  // A detached scope, so the calls outlive whichever component asks first.
  pmsSettings ??= effectScope(true).run(createPmsSettings)!;
  return pmsSettings;
}
