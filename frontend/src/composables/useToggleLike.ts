import {
  computed,
  reactive,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import { toast, useCall } from "frappe-ui";
import { errorMessage } from "@/utils/errors";

export interface ToggleLikeOptions {
  doctype: string;
  name: MaybeRefOrGetter<string>;
  /** Liked state from the server, e.g. from `_liked_by`; the local state follows it. */
  liked: MaybeRefOrGetter<boolean>;
  /** Runs after a successful toggle, e.g. to reload a list. */
  onToggled?: (liked: boolean) => void;
}

/**
 * Stars or unstars a document with `frappe.desk.like.toggle_like`. The star flips at
 * once and flips back, with an error toast, if the request fails.
 */
export function useToggleLike(options: ToggleLikeOptions) {
  const liked = ref(toValue(options.liked));
  watch(
    () => toValue(options.liked),
    (value) => (liked.value = value),
  );

  const call = useCall<unknown, { doctype: string; name: string; add: string }>(
    {
      url: "/api/v2/method/frappe.desk.like.toggle_like",
      method: "POST",
      immediate: false,
    },
  );

  async function toggle() {
    const next = !liked.value;
    liked.value = next;
    // submit() rejects when the request fails; the error is read from the call below.
    await call
      .submit({
        doctype: options.doctype,
        name: toValue(options.name),
        add: next ? "Yes" : "No",
      })
      .catch(() => undefined);
    if (call.error) {
      liked.value = !next;
      toast.error(errorMessage(call.error));
      return;
    }
    options.onToggled?.(next);
  }

  return reactive({
    liked,
    isToggling: computed(() => call.loading),
    toggle,
  });
}

/** Whether `user` is in a document's `_liked_by` JSON array. */
export function isLikedBy(likedBy: string | null | undefined, user: string) {
  if (!likedBy) return false;
  try {
    const users: unknown = JSON.parse(likedBy);
    return Array.isArray(users) && users.includes(user);
  } catch {
    return false;
  }
}
