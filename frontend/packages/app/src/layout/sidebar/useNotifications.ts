/**
 * External dependencies.
 */
import { useMemo } from "react";
import type { NotificationEntry } from "@next-pms/design-system/components";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useFrappeGetDocList } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { hashString } from "@/lib/utils";
import { useUser } from "@/providers/user";

interface NotificationDoc {
  name: string;
  label: string;
  owner: string;
  creation: string;
  linked_doctype: string;
  linked_document: string;
}

interface UserDetails {
  name: string;
  full_name: string;
  user_image: string | null;
}

const NOTIFICATION_LIMIT = 20;

export function useNotifications(): {
  notifications: NotificationEntry[];
  isLoading: boolean;
} {
  const userId = useUser(({ state }) => state.userId);

  const { data, isLoading } = useFrappeGetDocList<NotificationDoc>(
    "NextPMS Notifications",
    {
      fields: [
        "name",
        "label",
        "owner",
        "creation",
        "linked_doctype",
        "linked_document",
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
      };
    });
  }, [data, userMap]);

  return { notifications, isLoading };
}
