/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { hashString } from "@/lib/utils";
import type { UserDetails } from "@/pages/project-details/types";

export function useUserDetails(emails: string[]) {
  const users = useMemo(
    () => [...new Set(emails.filter(Boolean))].sort(),
    [emails],
  );
  const swrKey = users.length
    ? `user-details-${hashString(users.join(","))}`
    : null;

  const { data, isLoading, error } = useFrappeGetCall<{
    message: UserDetails[];
  }>("next_pms.next_projects.api.user.get_user_details", { users }, swrKey, {
    revalidateOnFocus: false,
  });

  return { data: data?.message, isLoading, error };
}
