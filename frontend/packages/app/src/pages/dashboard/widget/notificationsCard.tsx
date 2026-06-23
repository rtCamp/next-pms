/**
 * External dependencies.
 */
import type { ComponentType, SVGProps } from "react";
import { File, Fire, Folder } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { LEADERSHIP_NOTIFICATIONS } from "../constants";

export type NotificationItem = {
  id: string;
  icon: "folder" | "fire" | "file";
  title: string;
  body: string;
  timeLabel: string;
};

const ICONS: Record<
  NotificationItem["icon"],
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  folder: Folder,
  fire: Fire,
  file: File,
};

export default function NotificationsCard() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink-gray-8">Notifications</h3>
        <button
          type="button"
          className="text-base text-ink-gray-5 hover:text-ink-gray-7"
        >
          See all
        </button>
      </div>
      <ul className="flex flex-col">
        {LEADERSHIP_NOTIFICATIONS.map((item, index) => {
          const Icon = ICONS[item.icon];
          return (
            <li key={item.id}>
              {index > 0 && <div className="my-3 h-px bg-outline-gray-1" />}
              <div className="flex items-start gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-gray-2 text-ink-gray-7">
                  <Icon className="size-[18px]" />
                </div>
                <div className="w-full flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-base font-medium text-ink-gray-7">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-xs text-ink-gray-5">
                      {item.timeLabel}
                    </span>
                  </div>
                  <p className="text-[13px] leading-[1.5] text-ink-gray-6">
                    {item.body}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
