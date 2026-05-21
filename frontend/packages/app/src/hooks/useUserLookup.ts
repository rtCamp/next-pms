/**
 * Internal Dependencies.
 */
import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type UserRecord = {
  name: string;
  full_name: string;
  user_image?: string;
};

export type UserLookupOption = LookupOption & {
  image?: string;
};

interface UseUserLookupOptions {
  /** Controls whether the user lookup should fetch for the current UI state. */
  shouldFetch?: boolean;
  /** Caps the number of user rows fetched per request. */
  pageSize?: number;
  /** Filters users by partial full name on the backend. */
  query: string;
  /** Revalidates the lookup when the window regains focus. */
  revalidateOnFocus?: boolean;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: UserLookupOption | null;
}

/**
 * Fetches Frappe User records for lookup fields that expect a User email (name).
 */
export const useUserLookup = ({
  shouldFetch = true,
  pageSize = 20,
  query,
  revalidateOnFocus,
  selectedOption,
}: UseUserLookupOptions) => {
  return useRemoteLookup<UserRecord[], UserRecord, UserLookupOption>({
    shouldFetch,
    query,
    pageSize,
    revalidateOnFocus,
    method: "frappe.client.get_list",
    params: ({ query: searchQuery, pageSize: limit }) => ({
      doctype: "User",
      fields: ["name", "full_name", "user_image"],
      filters: [
        ["user_type", "=", "System User"],
        ["enabled", "=", 1],
        ...(searchQuery ? [["full_name", "like", `%${searchQuery}%`]] : []),
      ],
      limit,
    }),
    getItems: (message) => message ?? [],
    mapOption: (user) => ({
      label: user.full_name || user.name,
      value: user.name,
      image: user.user_image,
    }),
    selectedOption,
  });
};
