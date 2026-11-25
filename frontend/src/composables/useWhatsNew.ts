import { effectScope, reactive, ref } from "vue";
import { useCall } from "frappe-ui";

function createWhatsNew() {
  const available = ref(window.boot?.whats_new_available ?? false);
  const unseen = ref(window.boot?.whats_new_unseen ?? false);
  const lastSeen = ref(window.boot?.whats_new_last_seen ?? null);
  const mark = useCall<null, { version: string }>({
    url: "/api/v2/method/next_pms.api.whats_new.mark_release_notes_seen",
    method: "POST",
    immediate: false,
  });

  return reactive({
    /** Whether the site has release notes: shows the menu item and the search target. */
    available,
    /** Whether a release is unseen: shows the unread dots. */
    unseen,
    /** The newest release the user has seen. */
    lastSeen,
    /**
     * Records `version`, the newest release the What's new page shows, as seen, and
     * clears the dots once it's saved; a failed save keeps them, as React.
     */
    markSeen(version: string) {
      if (version === lastSeen.value) return;
      mark
        .submit({ version })
        .then(() => {
          lastSeen.value = version;
          unseen.value = false;
        })
        .catch(() => undefined);
    },
  });
}

let whatsNew: ReturnType<typeof createWhatsNew> | undefined;

/** The What's new state from the boot data, shared by the sidebar and the page. */
export function useWhatsNew() {
  // A detached scope, so the call outlives whichever component asks first.
  whatsNew ??= effectScope(true).run(createWhatsNew)!;
  return whatsNew;
}
