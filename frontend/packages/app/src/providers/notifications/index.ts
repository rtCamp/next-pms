/**
 * External dependencies.
 */
import type { NotificationEntry } from "@next-pms/design-system/components";
import { createContext, useContextSelector } from "use-context-selector";

export interface NotificationsContextProps {
  state: {
    /** Notifications for the current user, newest first. */
    notifications: NotificationEntry[];
    /** Indicates whether notifications are still being fetched. */
    isLoading: boolean;
    /** Number of notifications the user has not yet viewed. */
    unreadCount: number;
  };
  actions: {
    /** Marks a single notification as viewed. */
    markAsViewed: (id: string) => Promise<void>;
    /** Marks every unread notification as viewed. */
    markAllAsViewed: () => Promise<void>;
  };
}

export const NotificationsContext = createContext<NotificationsContextProps>({
  state: {
    notifications: [],
    isLoading: false,
    unreadCount: 0,
  },
  actions: {
    markAsViewed: () => Promise.resolve(),
    markAllAsViewed: () => Promise.resolve(),
  },
});

export const useNotifications = <T>(
  selector: (state: NotificationsContextProps) => T = (state) => state as T,
) => {
  return useContextSelector(NotificationsContext, selector);
};
