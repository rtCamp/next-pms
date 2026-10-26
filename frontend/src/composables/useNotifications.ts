import {
  computed,
  inject,
  onScopeDispose,
  provide,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { dayjs, toast, useList } from "frappe-ui";
import type { NotificationEntry } from "@/components/NotificationTray";
import { useSession } from "@/session";
import { useSocket } from "@/socket";
import { errorMessage } from "@/utils/errors";

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

export interface AppNotifications {
  /** The latest notifications, newest first. */
  notifications: ComputedRef<NotificationEntry[]>;
  unreadCount: ComputedRef<number>;
  loading: ComputedRef<boolean>;
  /** Whether the shell's notification tray is open. */
  trayOpen: Ref<boolean>;
  markAsViewed: (id: string) => Promise<void>;
  markAllAsViewed: () => Promise<void>;
  /** Marks the notification viewed, then follows its link. */
  openNotification: (notification: NotificationEntry) => Promise<void>;
}

const notificationsKey: InjectionKey<AppNotifications> =
  Symbol("notifications");

/**
 * Loads the signed-in user's 20 latest notifications for the whole app, newest first,
 * and reloads them on the realtime `notification` and `pm_report_ready` events. Call
 * once, in the shell; `enabled` gates the loading on the user's roles.
 */
export function provideNotifications(
  enabled: MaybeRefOrGetter<boolean>,
): AppNotifications {
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
    immediate: false,
  });

  // The roles arrive with the session, after the shell is set up.
  watch(
    () => toValue(enabled) && Boolean(session.userId),
    (load) => {
      if (load) list.reload();
    },
    { immediate: true },
  );

  const reload = () => {
    if (toValue(enabled)) list.reload();
  };
  for (const event of NOTIFICATION_EVENTS) socket.on(event, reload);
  onScopeDispose(() => {
    for (const event of NOTIFICATION_EVENTS) socket.off(event, reload);
  });

  const docs = computed(() => (toValue(enabled) ? (list.data ?? []) : []));

  /** Marks the notifications viewed; a failure shows a toast and doesn't reject. */
  async function markViewed(ids: string[]) {
    try {
      await Promise.all(
        ids.map((name) => list.setValue.submit({ name, viewed: 1 })),
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function markAsViewed(id: string) {
    const doc = docs.value.find((row) => row.name === id);
    if (!doc || doc.viewed) return;
    await markViewed([id]);
  }

  async function markAllAsViewed() {
    const unread = docs.value.filter((doc) => !doc.viewed);
    if (!unread.length) return;
    await markViewed(unread.map((doc) => doc.name));
  }

  const notifications: AppNotifications = {
    notifications: computed(() => docs.value.map(toNotificationEntry)),
    unreadCount: computed(() => docs.value.filter((doc) => !doc.viewed).length),
    loading: computed(() => list.loading),
    trayOpen: ref(false),
    markAsViewed,
    markAllAsViewed,
    async openNotification(notification) {
      await markAsViewed(notification.id);
      if (notification.href) window.location.assign(notification.href);
    },
  };
  provide(notificationsKey, notifications);
  return notifications;
}

/**
 * The shell's notifications. Without the shell (stories) or for a user without
 * notification access, an empty set whose actions do nothing, as in React.
 */
export function useNotifications(): AppNotifications {
  return (
    inject(notificationsKey, null) ?? {
      notifications: computed(() => []),
      unreadCount: computed(() => 0),
      loading: computed(() => false),
      trayOpen: ref(false),
      markAsViewed: async () => {},
      markAllAsViewed: async () => {},
      openNotification: async () => {},
    }
  );
}
