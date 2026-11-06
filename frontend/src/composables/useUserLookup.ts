import type { MaybeRefOrGetter } from "vue";
import { useRemoteLookup, type LookupOption } from "./useRemoteLookup";

interface UserItem {
  name: string;
  full_name?: string | null;
  user_image?: string | null;
}

export interface UserLookupOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
  selected?: MaybeRefOrGetter<LookupOption | null | undefined>;
}

/**
 * Searches enabled System Users by full name with `frappe.client.get_list`, for
 * pickers whose value is a User (email). Options carry the user's avatar image.
 */
export function useUserLookup(options: UserLookupOptions) {
  return useRemoteLookup<UserItem[] | null, UserItem>({
    method: "frappe.client.get_list",
    enabled: options.enabled,
    query: options.query,
    selected: options.selected,
    params: (query) => ({
      doctype: "User",
      fields: JSON.stringify(["name", "full_name", "user_image"]),
      filters: JSON.stringify([
        ["user_type", "=", "System User"],
        ["enabled", "=", 1],
        ...(query ? [["full_name", "like", `%${query}%`]] : []),
      ]),
      limit_page_length: 20,
    }),
    getItems: (response) => response ?? [],
    toOption: (user) => ({
      label: user.full_name || user.name,
      value: user.name,
      image: user.user_image ?? undefined,
    }),
  });
}
