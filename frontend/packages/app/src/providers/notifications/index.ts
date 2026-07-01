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
    /** Whether the notification tray panel is open. */
    isTrayOpen: boolean;
  };
  actions: {
    /** Marks a single notification as viewed. */
    markAsViewed: (id: string) => Promise<void>;
    /** Marks every unread notification as viewed. */
    markAllAsViewed: () => Promise<void>;
    /** Opens the notification tray. */
    openTray: () => void;
    /** Closes the notification tray. */
    closeTray: () => void;
  };
}

export const NotificationsContext = createContext<NotificationsContextProps>({
  state: {
    notifications: [],
    isLoading: false,
    unreadCount: 0,
    isTrayOpen: false,
  },
  actions: {
    markAsViewed: () => Promise.resolve(),
    markAllAsViewed: () => Promise.resolve(),
    openTray: () => undefined,
    closeTray: () => undefined,
  },
});

export const useNotifications = <T>(
  selector: (state: NotificationsContextProps) => T = (state) => state as T,
) => {
  return useContextSelector(NotificationsContext, selector);
};
