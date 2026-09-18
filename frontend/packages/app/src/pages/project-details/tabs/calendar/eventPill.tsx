/**
 * External dependencies.
 */
import { useRef } from "react";
import { Tooltip } from "@rtcamp/frappe-ui-react";
import { Sparkle, Zap } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import type { ProjectTimelineItem } from "./types";

type EventPillProps = { item: ProjectTimelineItem };

export function EventPill({ item }: EventPillProps) {
  const titleRef = useRef<HTMLSpanElement>(null);
  const isMilestone = item.type === "Milestone";

  return (
    <Tooltip text={item.title} showWhen="truncated" truncationRef={titleRef}>
      <div
        className={mergeClassNames(
          "flex items-center gap-1 rounded p-1 text-xs w-full cursor-pointer",
          "max-md:justify-center max-md:gap-0",
          isMilestone
            ? "bg-surface-blue-2 text-blue-700"
            : "bg-surface-violet-1 text-violet-700",
          item.isComplete && "opacity-60",
        )}
      >
        {isMilestone ? (
          <Sparkle className="size-3 shrink-0" />
        ) : (
          <Zap className="size-3 shrink-0" />
        )}
        <span
          ref={titleRef}
          className={mergeClassNames(
            "min-w-0 leading-tight truncate max-md:w-0",
            item.isComplete && "line-through",
          )}
        >
          {item.title}
        </span>
      </div>
    </Tooltip>
  );
}
