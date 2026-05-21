/**
 * External dependencies.
 */
import { Diamond, Zap } from "lucide-react";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import type { ProjectTimelineItem } from "./types";

type EventPillProps = { item: ProjectTimelineItem; truncate?: boolean };

export function EventPill({ item, truncate = false }: EventPillProps) {
  const isMilestone = item.type === "Milestone";

  return (
    <div
      className={mergeClassNames(
        "flex gap-1 rounded p-1 text-xs w-full",
        truncate ? "items-center" : "items-start",
        isMilestone
          ? "bg-surface-blue-2 text-blue-700"
          : "bg-surface-violet-1 text-violet-700",
      )}
      title={item.title}
    >
      {isMilestone ? (
        <Diamond className="size-3 shrink-0" />
      ) : (
        <Zap className="size-3 shrink-0" />
      )}
      <span
        className={mergeClassNames(
          "min-w-0 leading-tight",
          truncate ? "truncate" : "wrap-break-word",
          item.isComplete && "line-through opacity-60",
        )}
      >
        {item.title}
      </span>
    </div>
  );
}
