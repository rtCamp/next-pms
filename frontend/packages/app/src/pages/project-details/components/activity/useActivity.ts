/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import type { ActivityResponse } from "./types";

export function useActivity(doctype: string, name: string, modified: string) {
  const { data, isLoading, error } = useFrappeGetCall<{
    message: ActivityResponse;
  }>(
    "next_pms.next_projects.api.activity.get_activity",
    { doctype, name },
    `activity-${doctype}-${name}-${modified}`,
    { revalidateOnFocus: false },
  );

  return {
    items: data?.message.items ?? [],
    users: data?.message.users ?? {},
    isLoading,
    error,
  };
}
