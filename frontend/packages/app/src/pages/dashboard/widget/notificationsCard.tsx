/**
 * External dependencies.
 */
import type { ComponentType } from "react";
import type { NotificationEntry } from "@next-pms/design-system/components";
import { File, Fire, Folder, Time, Check } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useNotifications } from "@/providers/notifications";

const DOCTYPE_ICON_MAP: Record<string, ComponentType<{ size?: number }>> = {
  Risk: Fire,
  Timesheet: Time,
  "Customer Feedback": File,
  Project: Folder,
};

const NotificationIcon = ({ linkedDoctype }: { linkedDoctype: string }) => {
  const Icon = DOCTYPE_ICON_MAP[linkedDoctype] ?? Check;
  return (
    <div
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-gray-2"
    >
      <Icon size={18} />
    </div>
  );
};

const renderMessage = (message: NotificationEntry["message"]) =>
  message.map((segment) => segment.text).join("");

export default function NotificationsCard() {
  const notifications = useNotifications(({ state }) => state.notifications);
  const isLoading = useNotifications(({ state }) => state.isLoading);
  const markAsViewed = useNotifications(({ actions }) => actions.markAsViewed);
  const openTray = useNotifications(({ actions }) => actions.openTray);

  const handleClick = async (notification: NotificationEntry) => {
    await markAsViewed(notification.id);
    if (notification.href) {
      window.location.assign(notification.href);
    }
  };

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink-gray-8">Notifications</h3>
        <button
          type="button"
          onClick={openTray}
          className="text-base text-ink-gray-8 hover:text-ink-gray-8"
        >
          See all
        </button>
      </div>
      {!isLoading && notifications.length === 0 ? (
        <p className="py-10 text-center text-base text-ink-gray-4">
          No notifications yet.
        </p>
      ) : (
        <ul className="flex flex-col overflow-y-scroll scrollbar-thin">
          {notifications.map((item, index) => (
            <li key={item.id}>
              {index > 0 && <div className="my-3 h-px bg-outline-gray-1" />}
              <a
                href={item.href}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.button !== 0
                  ) {
                    markAsViewed(item.id);
                    return;
                  }
                  event.preventDefault();
                  handleClick(item);
                }}
                className="flex cursor-pointer items-start gap-2"
              >
                <NotificationIcon linkedDoctype={item.linkedDoctype} />
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    {item.title && (
                      <span className="truncate text-base font-medium text-ink-gray-7">
                        {item.title}
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-ink-gray-5">
                      {item.timeLabel}
                    </span>
                  </div>
                  <p className="text-[13px] leading-[1.5] text-ink-gray-6">
                    {renderMessage(item.message)}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
