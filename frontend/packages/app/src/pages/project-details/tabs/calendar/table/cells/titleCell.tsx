/**
 * External dependencies.
 */
import { Sparkle, Zap } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { ProjectTimelineItem } from "../../types";

export function TitleCell({ item }: { item: ProjectTimelineItem }) {
  const Icon = item.type === "Milestone" ? Sparkle : Zap;

  return (
    <div className="flex items-center gap-2 text-ink-gray-8">
      <Icon className="size-3.5 shrink-0" />
      <span className="font-medium truncate max-w-56">{item.title}</span>
    </div>
  );
}
