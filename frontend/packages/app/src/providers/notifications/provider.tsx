/**
 * External dependencies.
 */
import {
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { NotificationEntry } from "@next-pms/design-system/components";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  FrappeContext,
  useFrappeGetDocList,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { toKebabCase } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { NotificationsContext } from ".";

interface NotificationDoc {
  name: string;
  label: string;
  title: string;
  creation: string;
  linked_doctype: string;
  linked_document: string;
  url: string | null;
  viewed: 0 | 1;
}

const NOTIFICATION_DOCTYPE = "NextPMS Notifications";
const MARK_AS_VIEWED_METHOD =
  "next_pms.next_pms.doctype.nextpms_notifications.nextpms_notifications.mark_as_viewed";
const NOTIFICATION_LIMIT = 20;

export const NotificationsProvider: FC<PropsWithChildren> = ({ children }) => {
  const userId = useUser(({ state }) => state.userId);

  const { data, isLoading, mutate } = useFrappeGetDocList<NotificationDoc>(
    NOTIFICATION_DOCTYPE,
    {
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
      filters: (userId
        ? [
            ["user", "=", userId],
            ["viewed", "=", 0],
          ]
        : []) as never,
      orderBy: { field: "creation", order: "desc" },
      limit: NOTIFICATION_LIMIT,
    },
    userId ? undefined : null,
  );

  const { socket } = useContext(FrappeContext) ?? {};

  useEffect(() => {
    if (!socket) return;
    const handleNotificationUpdate = () => {
      mutate();
    };

    socket.on("pm_report_ready", handleNotificationUpdate);
    socket.on("notification", handleNotificationUpdate);
    return () => {
      socket.off("pm_report_ready", handleNotificationUpdate);
      socket.off("notification", handleNotificationUpdate);
    };
  }, [socket, mutate]);

  const notifications = useMemo<NotificationEntry[]>(() => {
    if (!data?.length) return [];

    return data.map((doc) => ({
      id: doc.name,
      linkedDoctype: doc.linked_doctype,
      title: doc.title || undefined,
      message: [{ text: doc.label }],
      timeLabel: formatDistanceToNow(parseISO(doc.creation.replace(" ", "T")), {
        addSuffix: true,
      }),
      read: Boolean(doc.viewed),
      href:
        doc.url ||
        (doc.linked_doctype && doc.linked_document
          ? `${ROUTES.desk}/${toKebabCase(doc.linked_doctype)}/${doc.linked_document}`
          : undefined),
    }));
  }, [data]);

  const unreadCount = useMemo(
    () => (data ?? []).filter((doc) => !doc.viewed).length,
    [data],
  );

  const { call: markViewed } = useFrappePostCall(MARK_AS_VIEWED_METHOD);

  const markAsViewed = useCallback(
    async (id: string) => {
      const doc = data?.find((row) => row.name === id);
      if (!doc || doc.viewed) return;
      try {
        await markViewed({ name: id });
        await mutate();
      } catch {
        // a failed update must not block the navigation that follows
      }
    },
    [data, markViewed, mutate],
  );

  const markAllAsViewed = useCallback(async () => {
    if (!data?.length) return;
    await markViewed({});
    await mutate();
  }, [data, markViewed, mutate]);

  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const openTray = useCallback(() => setIsTrayOpen(true), []);
  const closeTray = useCallback(() => setIsTrayOpen(false), []);

  const value = useMemo(
    () => ({
      state: { notifications, isLoading, unreadCount, isTrayOpen },
      actions: { markAsViewed, markAllAsViewed, openTray, closeTray },
    }),
    [
      notifications,
      isLoading,
      unreadCount,
      isTrayOpen,
      markAsViewed,
      markAllAsViewed,
      openTray,
      closeTray,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
