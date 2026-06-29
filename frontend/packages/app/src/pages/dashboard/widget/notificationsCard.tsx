/**
 * External dependencies.
 */
import type { NotificationEntry } from "@next-pms/design-system/components";
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useNotifications } from "@/providers/notifications";

const renderMessage = (message: NotificationEntry["message"]) =>
  message.map((segment) => segment.text).join("");

export default function NotificationsCard() {
  const notifications = useNotifications(({ state }) => state.notifications);
  const isLoading = useNotifications(({ state }) => state.isLoading);
  const markAsViewed = useNotifications(({ actions }) => actions.markAsViewed);

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
        <a
          href="/desk/nextpms-notifications"
          target="_blank"
          rel="noreferrer"
          aria-label="Open employee"
          className="text-base text-ink-gray-8 hover:text-ink-gray-8"
        >
          See all
        </a>
      </div>
      {!isLoading && notifications.length === 0 ? (
        <p className="py-10 text-center text-base text-ink-gray-4">
          No notifications yet.
        </p>
      ) : (
        <ul className="flex flex-col overflow-y-scroll">
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
                    void markAsViewed(item.id);
                    return;
                  }
                  event.preventDefault();
                  void handleClick(item);
                }}
                className="flex cursor-pointer items-start gap-2"
              >
                <Avatar
                  size="md"
                  shape="circle"
                  image={item.image}
                  label={item.name}
                />
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-base font-medium text-ink-gray-7">
                      {item.name}
                    </span>
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
