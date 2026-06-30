/**
 * External dependencies.
 */
import React from "react";
import { Avatar } from "@rtcamp/frappe-ui-react";
/**
 * Internal dependencies.
 */
import type { NotificationEntry } from "./types";
import { mergeClassNames as cn } from "../../utils";

const NotificationItem = ({
  notification,
  onSelect,
}: {
  notification: NotificationEntry;
  onSelect?: (notification: NotificationEntry) => void;
}) => {
  const { name, image, message, timeLabel, read, href } = notification;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onSelect) return;
    // Let the browser handle new-tab / middle-click natively.
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.button !== 0
    ) {
      onSelect(notification);
      return;
    }
    event.preventDefault();
    onSelect(notification);
  };

  return (
    <a
      href={href}
      tabIndex={0}
      onClick={handleClick}
      className="group flex cursor-pointer items-start gap-2.5 rounded-[10px] p-2.5 hover:bg-surface-gray-2"
    >
      <span
        className={cn(
          "mt-2.5 size-2 shrink-0 rounded-full",
          read ? "bg-transparent" : "bg-surface-blue-5",
        )}
      />
      <Avatar size="lg" shape="circle" image={image} label={name} alt={name} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm leading-5 text-ink-gray-6">
          {message.map((segment, index) => {
            if (segment.emphasis === "strong") {
              return (
                <strong key={index} className="font-bold text-ink-gray-7">
                  {segment.text}
                </strong>
              );
            }
            if (segment.emphasis === "subject") {
              return (
                <span key={index} className="font-medium text-ink-gray-7">
                  {segment.text}
                </span>
              );
            }
            return <span key={index}>{segment.text}</span>;
          })}
        </p>
        <span className="text-xs text-ink-gray-5">{timeLabel}</span>
      </div>
    </a>
  );
};

export default NotificationItem;
