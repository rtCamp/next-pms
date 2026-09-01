/**
 * Internal dependencies.
 */
import { DEFAULT_AUTO_EXPAND_WEEKS } from "@/lib/constant";
import { usePMSSettings } from "./usePMSSettings";

export function useDefaultExpandedWeeks() {
  const { isLoading, pmsSettings } = usePMSSettings(true);

  const defaultExpandedWeeks = pmsSettings?.use_system_auto_expand_weeks
    ? pmsSettings.system_auto_expand_weeks_by_default
    : (pmsSettings?.auto_expand_weeks_by_default ?? DEFAULT_AUTO_EXPAND_WEEKS);

  return { defaultExpandedWeeks, isLoading };
}
