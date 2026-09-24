/**
 * External dependencies.
 */
import { Lock, Sparkle, Zap } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ItemHoverCard } from "../../itemHoverCard";
import type { ProjectTimelineItem } from "../../types";

export function TitleCell({ item }: { item: ProjectTimelineItem }) {
  const Icon = item.type === "Milestone" ? Sparkle : Zap;

  return (
    <div className="flex items-center gap-2 text-ink-gray-8">
      <Icon className="size-3.5 shrink-0" />
      <ItemHoverCard item={item}>
        <span className="flex min-w-0 items-center gap-2">
          <span className="font-medium truncate max-w-56">{item.title}</span>
          {item.isInternal && (
            <Lock className="size-3.5 shrink-0 text-ink-gray-5" />
          )}
        </span>
      </ItemHoverCard>
    </div>
  );
}
