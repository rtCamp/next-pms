/**
 * External dependencies.
 */
import React, { type ComponentType } from "react";
import { Folder, Fire, File, Time, Check } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { NotificationEntry } from "./types";
import { mergeClassNames as cn } from "../../utils";

const DOCTYPE_ICON_MAP: Record<string, ComponentType<{ size?: number }>> = {
  Risk: Fire,
  Timesheet: Time,
  "Customer Feedback": File,
  Project: Folder,
};

const NotificationIcon = ({ linkedDoctype }: { linkedDoctype: string }) => {
  const Icon = DOCTYPE_ICON_MAP[linkedDoctype] ?? Check;
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-gray-2">
      <Icon size={18} />
    </div>
  );
};

const NotificationItem = ({
  notification,
  onSelect,
}: {
  notification: NotificationEntry;
  onSelect?: (notification: NotificationEntry) => void;
}) => {
  const { linkedDoctype, title, message, timeLabel, read, href } = notification;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onSelect) return;
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
      <NotificationIcon linkedDoctype={linkedDoctype} />
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          {title && (
            <span className="truncate text-sm font-medium text-ink-gray-7">
              {title}
            </span>
          )}
          <span className="shrink-0 text-xs text-ink-gray-5">{timeLabel}</span>
        </div>
        <p className="text-[13px] leading-[1.5] text-ink-gray-6">
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
      </div>
    </a>
  );
};

export default NotificationItem;
