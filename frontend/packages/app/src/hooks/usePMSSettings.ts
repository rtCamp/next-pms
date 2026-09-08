/**
 * External dependencies.
 */
import {
  useFrappeGetCall,
  useFrappeGetDoc,
  useFrappePostCall,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { PMSSettings, SystemSettings } from "@/components/settings/types";

const PMS_SETTINGS_API =
  "next_pms.next_pms.doctype.pms_user_setting.pms_user_setting";
const SYSTEM_SETTINGS_DOCTYPE = "Timesheet Settings";

export function usePMSSettings(enabled: boolean) {
  const { data, error, isLoading, mutate } = useFrappeGetCall<{
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
    error,
    isLoading,
    isSaving,
    pmsSettings: data?.message,
    mutate,
    updatePMSSettings,
  };
}

export function usePMSSystemSettings(enabled: boolean) {
  const { data, error, isLoading, mutate } = useFrappeGetDoc<SystemSettings>(
    SYSTEM_SETTINGS_DOCTYPE,
    SYSTEM_SETTINGS_DOCTYPE,
    enabled ? undefined : null,
  );
  const { updateDoc, loading: isSaving } = useFrappeUpdateDoc();

  const updateSystemSettings = (values: SystemSettings) =>
    updateDoc(SYSTEM_SETTINGS_DOCTYPE, SYSTEM_SETTINGS_DOCTYPE, values);

  return {
    error,
    isLoading,
    isSaving,
    systemSettings: data,
    mutate,
    updateSystemSettings,
  };
}

export function usePMSSystemApiKey(hasApiKey: boolean) {
  const fieldname = "pm_report_api_key";
  const method = "frappe.client.get_password";
  const { data, isLoading, error } = useFrappeGetCall<{
    message: string;
  }>(
    method,
    {
      doctype: SYSTEM_SETTINGS_DOCTYPE,
      name: SYSTEM_SETTINGS_DOCTYPE,
      fieldname,
    },
    hasApiKey ? `${method}:${fieldname}` : null,
  );

  return {
    value: data?.message ?? null,
    isLoading,
    error,
  };
}
