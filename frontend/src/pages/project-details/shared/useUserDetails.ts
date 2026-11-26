import { computed, toValue, watch, type MaybeRefOrGetter } from "vue";
import { useCall } from "frappe-ui";
import { GET_LIST_URL, USER_DETAILS_URL } from "./constants";
import type { UserDetails } from "./types";

/**
 * Reads the full name and image of the given users, again whenever the set of users
 * changes. Users not read (yet) are missing from the map. `"userList"` reads the User
 * list, which hides images from all but System Managers; `"userDetails"` asks
 * `get_user_details`, as React's Growth tab does.
 */
export function useUserDetails(
  userIds: MaybeRefOrGetter<readonly string[]>,
  source: "userList" | "userDetails" = "userList",
) {
  const ids = computed(() =>
    [...new Set(toValue(userIds).filter(Boolean))].sort(),
  );
  const call = useCall<UserDetails[], Record<string, unknown>>({
    url: source === "userList" ? GET_LIST_URL : USER_DETAILS_URL,
    params: () =>
      source === "userList"
        ? {
            doctype: "User",
            fields: JSON.stringify(["name", "full_name", "user_image"]),
            filters: JSON.stringify([["name", "in", ids.value]]),
            limit_page_length: ids.value.length,
          }
        : { users: JSON.stringify(ids.value) },
    immediate: false,
  });
  watch(
    () => ids.value.join(","),
    (key) => {
      if (key) call.fetch();
    },
    { immediate: true },
  );
  return computed(
    () => new Map((call.data ?? []).map((user) => [user.name, user])),
  );
}
