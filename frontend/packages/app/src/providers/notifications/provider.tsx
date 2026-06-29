/**
 * External dependencies.
 */
import { FC, PropsWithChildren, useCallback, useMemo } from "react";
import type { NotificationEntry } from "@next-pms/design-system/components";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useFrappeGetDocList, useFrappeUpdateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { hashString, toKebabCase } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { NotificationsContext } from ".";

interface NotificationDoc {
  name: string;
  label: string;
  owner: string;
  creation: string;
  linked_doctype: string;
  linked_document: string;
  viewed: 0 | 1;
}

interface UserDetails {
  name: string;
  full_name: string;
  user_image: string | null;
}

const NOTIFICATION_DOCTYPE = "NextPMS Notifications";
const NOTIFICATION_LIMIT = 20;

export const NotificationsProvider: FC<PropsWithChildren> = ({ children }) => {
  const userId = useUser(({ state }) => state.userId);

  const { data, isLoading, mutate } = useFrappeGetDocList<NotificationDoc>(
    NOTIFICATION_DOCTYPE,
    {
      fields: [
        "name",
        "label",
        "owner",
        "creation",
        "linked_doctype",
        "linked_document",
        "viewed",
      ],
      filters: (userId ? [["user", "=", userId]] : []) as never,
      orderBy: { field: "creation", order: "desc" },
      limit: NOTIFICATION_LIMIT,
    },
    userId ? undefined : null,
  );

  const owners = useMemo(() => {
    const emails = (data ?? []).map((row) => row.owner).filter(Boolean);
    return [...new Set(emails)];
  }, [data]);

  const usersSwrKey = useMemo(() => {
    if (!owners.length) return null;
    return `notifications-users-${hashString(owners.slice().sort().join(","))}`;
  }, [owners]);

  const { data: usersData } = useFrappeGetDocList<UserDetails>(
    "User",
    {
      fields: ["name", "full_name", "user_image"],
      filters: (owners.length ? [["name", "in", owners]] : []) as never,
      limit: owners.length || 1,
    },
    usersSwrKey,
  );

  const userMap = useMemo(
    () =>
      Object.fromEntries((usersData ?? []).map((user) => [user.name, user])),
    [usersData],
  );

  const notifications = useMemo<NotificationEntry[]>(() => {
    if (!data?.length) return [];

    return data.map((doc) => {
      const details = userMap[doc.owner];

      return {
        id: doc.name,
        name: details?.full_name?.trim() || doc.owner,
        image: details?.user_image ?? undefined,
        message: [{ text: doc.label }],
        timeLabel: formatDistanceToNow(
          parseISO(doc.creation.replace(" ", "T")),
          {
            addSuffix: true,
          },
        ),
        read: Boolean(doc.viewed),
        href:
          doc.linked_doctype && doc.linked_document
            ? `${ROUTES.desk}/${toKebabCase(doc.linked_doctype)}/${doc.linked_document}`
            : undefined,
      };
    });
  }, [data, userMap]);

  const unreadCount = useMemo(
    () => (data ?? []).filter((doc) => !doc.viewed).length,
    [data],
  );

  const { updateDoc } = useFrappeUpdateDoc();

  const markAsViewed = useCallback(
    async (id: string) => {
      const doc = data?.find((row) => row.name === id);
      if (!doc || doc.viewed) return;
      await updateDoc(NOTIFICATION_DOCTYPE, id, { viewed: 1 });
      await mutate();
    },
    [data, updateDoc, mutate],
  );

  const markAllAsViewed = useCallback(async () => {
    const unread = (data ?? []).filter((doc) => !doc.viewed);
    if (!unread.length) return;
    await Promise.all(
      unread.map((doc) =>
        updateDoc(NOTIFICATION_DOCTYPE, doc.name, { viewed: 1 }),
      ),
    );
    await mutate();
  }, [data, updateDoc, mutate]);

  const value = useMemo(
    () => ({
      state: { notifications, isLoading, unreadCount },
      actions: { markAsViewed, markAllAsViewed },
    }),
    [notifications, isLoading, unreadCount, markAsViewed, markAllAsViewed],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
