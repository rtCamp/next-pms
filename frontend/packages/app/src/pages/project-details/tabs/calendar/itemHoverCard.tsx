/**
 * External dependencies.
 */
import type { ReactElement } from "react";
import { Popover } from "@base-ui/react/popover";
import { Lock, Sparkle, Tag, Zap } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { ProjectTimelineItem } from "./types";

type ItemHoverCardProps = {
  item: ProjectTimelineItem;
  children: ReactElement;
};

export function ItemHoverCard({ item, children }: ItemHoverCardProps) {
  const TypeIcon = item.type === "Milestone" ? Sparkle : Zap;

  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={200}
        closeDelay={150}
        nativeButton={false}
        render={children}
      />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={4}>
          <Popover.Popup className="z-50 outline-none">
            <div className="flex flex-col gap-3 p-3 rounded-xl shadow-2xl w-max max-w-70 bg-surface-modal animate-fade-in">
              <div className="flex gap-2 items-start">
                <TypeIcon className="mt-px size-4 text-ink-gray-7 shrink-0" />
                <span className="min-w-0 text-base font-medium break-words text-ink-gray-7">
                  {item.title}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {item.categoryLabel && (
                  <div className="flex gap-2 items-center">
                    <Tag className="size-4 text-ink-gray-6 shrink-0" />
                    <span className="text-sm text-ink-gray-6 truncate">
                      {item.categoryLabel}
                    </span>
                  </div>
                )}
                {item.isInternal && (
                  <div className="flex gap-2 items-center">
                    <Lock className="size-4 text-ink-gray-6 shrink-0" />
                    <span className="text-sm text-ink-gray-6">Internal</span>
                  </div>
                )}
              </div>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
