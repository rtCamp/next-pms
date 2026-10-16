import { computed, onScopeDispose } from "vue";
import { dayjs, useList } from "frappe-ui";
import type { NotificationEntry } from "@/components/NotificationTray";
import { useSession } from "@/session";
import { useSocket } from "@/socket";

const NOTIFICATION_DOCTYPE = "NextPMS Notifications";
const NOTIFICATION_LIMIT = 20;
/** Socket events after which the list is reloaded. */
const NOTIFICATION_EVENTS = ["notification", "pm_report_ready"];

export interface NotificationDoc {
  name: string;
  label: string;
  title: string | null;
  creation: string;
  linked_doctype: string | null;
  linked_document: string | null;
  url: string | null;
  viewed: 0 | 1;
}

/** `"Project Status Update"` → `"project-status-update"`, as Desk routes name doctypes. */
function deskSlug(doctype: string): string {
  return doctype
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/** A notification document as a tray entry; it links to its URL, else to the linked document in Desk. */
export function toNotificationEntry(doc: NotificationDoc): NotificationEntry {
  const deskHref =
    doc.linked_doctype && doc.linked_document
      ? `/desk/${deskSlug(doc.linked_doctype)}/${doc.linked_document}`
      : undefined;
  return {
    id: doc.name,
    linkedDoctype: doc.linked_doctype ?? "",
    title: doc.title || undefined,
    message: [{ text: doc.label }],
    timeLabel: dayjs(doc.creation).fromNow(),
    read: Boolean(doc.viewed),
    href: doc.url || deskHref,
  };
}

/**
 * The signed-in user's 20 latest notifications, newest first, reloaded on the realtime
 * `notification` and `pm_report_ready` events. Call from a component's setup.
 */
export function useNotifications() {
  const session = useSession();
  const socket = useSocket();

  const list = useList<NotificationDoc>({
    doctype: NOTIFICATION_DOCTYPE,
    fields: [
      "name",
      "label",
      "title",
      "creation",
      "linked_doctype",
      "linked_document",
      "url",
      "viewed",
    ],
    filters: () => ({ user: session.userId }),
    orderBy: "creation desc",
    limit: NOTIFICATION_LIMIT,
    immediate: Boolean(session.userId),
  });

  const reload = () => list.reload();
  for (const event of NOTIFICATION_EVENTS) socket.on(event, reload);
  onScopeDispose(() => {
    for (const event of NOTIFICATION_EVENTS) socket.off(event, reload);
  });

  const docs = computed(() => list.data ?? []);

  async function markAsViewed(id: string) {
    const doc = docs.value.find((row) => row.name === id);
    if (!doc || doc.viewed) return;
    await list.setValue.submit({ name: id, viewed: 1 });
  }

  async function markAllAsViewed() {
    const unread = docs.value.filter((doc) => !doc.viewed);
    if (!unread.length) return;
    await Promise.all(
      unread.map((doc) => list.setValue.submit({ name: doc.name, viewed: 1 })),
    );
  }

  return {
    notifications: computed(() => docs.value.map(toNotificationEntry)),
    unreadCount: computed(() => docs.value.filter((doc) => !doc.viewed).length),
    loading: computed(() => list.loading),
    markAsViewed,
    markAllAsViewed,
  };
}
