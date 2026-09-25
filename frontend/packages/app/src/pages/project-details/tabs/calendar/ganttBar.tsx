/**
 * External dependencies.
 */
import { Lock, Sparkle, Zap } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { MIN_BAR_WIDTH } from "./constants";
import { FloatingChip } from "./floatingChip";
import { ItemHoverCard } from "./itemHoverCard";
import type { ProjectTimelineItem } from "./types";

type ItemPosition = { left: number; width: number };

type GanttBarProps = {
  item: ProjectTimelineItem;
  pos: ItemPosition;
  totalWidth: number;
};

export function GanttBar({ item, pos, totalWidth }: GanttBarProps) {
  if (item.type === "Milestone") {
    if (pos.width <= MIN_BAR_WIDTH) {
      return (
        <FloatingChip
          item={item}
          pos={pos}
          totalWidth={totalWidth}
          icon={Sparkle}
          chipClassName="bg-surface-blue-2 text-blue-700"
          textClassName="text-blue-700"
        />
      );
    }

    return (
      <ItemHoverCard item={item}>
        <div
          className="absolute top-1/2 -translate-y-1/2 z-1 flex items-center gap-1.5 px-2.5 rounded-md overflow-hidden mx-0.5 bg-surface-blue-2 text-blue-700"
          style={{ left: pos.left, width: pos.width, height: 32 }}
        >
          <Sparkle className="size-3.5 shrink-0" />
          <span
            className={`truncate text-sm${item.isComplete ? " line-through opacity-60" : ""}`}
          >
            {item.title}
          </span>
          {item.isInternal && <Lock className="size-3.5 shrink-0 ml-auto" />}
        </div>
      </ItemHoverCard>
    );
  }

  return (
    <FloatingChip
      item={item}
      pos={pos}
      totalWidth={totalWidth}
      icon={Zap}
      chipClassName="bg-surface-violet-1 text-violet-700"
      textClassName="text-violet-700"
    />
  );
}
