/**
 * External dependencies.
 */
import { Dialog } from "@base-ui/react/dialog";
import { ScrollArea } from "@base-ui/react/scroll-area";
import { Tooltip } from "@rtcamp/frappe-ui-react";
import { Close, DoubleCheck, Settings } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import NotificationItem from "./notificationItem";
import type { NotificationEntry } from "./types";
import { mergeClassNames as cn } from "../../utils";

export interface NotificationTrayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: NotificationEntry[];
  /**
   * Tailwind `left-*` utility matching the sidebar width, so the tray docks to
   * the right edge of the sidebar (e.g. "left-12" collapsed, "left-60" expanded).
   */
  offsetClassName?: string;
  onMarkAllRead?: () => void;
  onSettings?: () => void;
  onNotificationClick?: (notification: NotificationEntry) => void;
}

const actionButtonClasses =
  "flex items-center justify-center rounded-md p-1.5 text-ink-gray-6 hover:bg-surface-gray-2 hover:text-ink-gray-8";

export default function NotificationTray({
  open,
  onOpenChange,
  notifications,
  offsetClassName = "left-0",
  onMarkAllRead,
  onSettings,
  onNotificationClick,
}: NotificationTrayProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-y-0 right-0 z-40 bg-black-overlay-200 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            offsetClassName,
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed inset-y-0 z-50 flex w-[360px] flex-col bg-surface-modal shadow-xl outline-none",
            offsetClassName,
          )}
        >
          <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
            <Dialog.Title className="text-sm font-medium text-ink-gray-8">
              Notifications
            </Dialog.Title>
            <div className="flex items-center gap-0.5">
              <Tooltip text="Notification Settings">
                <button
                  type="button"
                  onClick={onSettings}
                  className={actionButtonClasses}
                >
                  <Settings size={16} />
                </button>
              </Tooltip>
              <Tooltip text="Mark all as read">
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className={actionButtonClasses}
                >
                  <DoubleCheck size={16} />
                </button>
              </Tooltip>
              <Dialog.Close className={actionButtonClasses}>
                <Close size={16} />
              </Dialog.Close>
            </div>
          </div>

          <ScrollArea.Root className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea.Viewport className="h-full">
              <ScrollArea.Content className="flex flex-col px-2 py-2">
                {notifications.length === 0 ? (
                  <p className="px-2 py-10 text-center text-sm text-ink-gray-4">
                    No notifications yet.
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onSelect={onNotificationClick}
                    />
                  ))
                )}
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className="flex w-1.5 touch-none select-none p-0.5">
              <ScrollArea.Thumb className="relative flex-1 rounded-full bg-gray-200 dark:bg-white/20" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
