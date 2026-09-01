/**
 * External dependencies.
 */
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { PMSSettings } from "@/components/settings/types";

const PMS_SETTINGS_API =
  "next_pms.next_pms.doctype.pms_user_setting.pms_user_setting";

export function usePMSSettings(enabled: boolean) {
  const { data, isLoading, mutate } = useFrappeGetCall<{
    message: PMSSettings;
  }>(
    `${PMS_SETTINGS_API}.get_pms_settings`,
    undefined,
    enabled ? `${PMS_SETTINGS_API}.get_pms_settings` : null,
  );
  const { call: updatePMSSettings, loading: isSaving } = useFrappePostCall(
    `${PMS_SETTINGS_API}.update_pms_settings`,
  );

  return {
    isLoading,
    isSaving,
    pmsSettings: data?.message,
    mutate,
    updatePMSSettings,
  };
}
