/**
 * External dependencies.
 */
import type { ComponentProps } from "react";
import { Sparkles } from "lucide-react";
/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { UnreadDot } from "./unreadDot";

type WhatsNewMenuItemProps = ComponentProps<"div"> & { active?: boolean };

export function WhatsNewMenuItem({
  active,
  className,
  ...props
}: WhatsNewMenuItemProps) {
  const hasUnseenRelease = useUser(({ state }) => state.hasUnseenRelease);

  return (
    <div
      {...props}
      aria-label={hasUnseenRelease ? "What's new, new release" : undefined}
      className={cn(
        "group flex h-7 w-full items-center rounded px-2 text-base text-ink-gray-7 focus:outline-none focus:bg-surface-gray-3 data-[highlighted]:bg-surface-gray-3",
        active && "bg-surface-gray-3",
        className,
      )}
    >
      <Sparkles size={16} className="text-ink-gray-6 mr-2 shrink-0" />
      <span className="min-w-0 flex-1 truncate">What&apos;s new</span>
      {hasUnseenRelease && <UnreadDot placement="menuItem" />}
    </div>
  );
}
