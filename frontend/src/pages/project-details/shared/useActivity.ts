import { computed, toValue, watch, type MaybeRefOrGetter } from "vue";
import { useCall } from "frappe-ui";
import { isAbortError } from "@/utils/errors";
import type { ActivityResponse } from "./activity";
import { ACTIVITY_URL } from "./constants";

/** A document's activity from `get_activity`, read again whenever its `modified` changes. */
export function useActivity(
  doctype: string,
  name: string,
  modified: MaybeRefOrGetter<string>,
) {
  const call = useCall<ActivityResponse, { doctype: string; name: string }>({
    url: ACTIVITY_URL,
    params: { doctype, name },
    immediate: false,
  });
  watch(
    () => toValue(modified),
    () => call.fetch(),
    { immediate: true },
  );
  return {
    items: computed(() => call.data?.items ?? []),
    users: computed(() => call.data?.users ?? {}),
    loading: computed(() => call.loading && !call.data),
    error: computed(() =>
      call.error && !isAbortError(call.error) ? call.error : null,
    ),
  };
}
