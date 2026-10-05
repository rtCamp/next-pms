/**
 * External dependencies.
 */
import type { ComponentType, SVGProps } from "react";
import { Lock } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";
import { FLOATING_LABEL_FLIP_THRESHOLD } from "./constants";
import { ItemHoverCard } from "./itemHoverCard";
import type { ProjectTimelineItem } from "./types";

type ItemPosition = { left: number; width: number };

type FloatingChipProps = {
  item: ProjectTimelineItem;
  pos: ItemPosition;
  totalWidth: number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  chipClassName: string;
  textClassName: string;
};

// Icon chip + floating label, flipped to the left when near the right edge.
export function FloatingChip({
  item,
  pos,
  totalWidth,
  icon: Icon,
  chipClassName,
  textClassName,
}: FloatingChipProps) {
  const spaceRight = totalWidth - (pos.left + pos.width);
  const flipLeft = spaceRight < FLOATING_LABEL_FLIP_THRESHOLD;

  return (
    <ItemHoverCard item={item}>
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-1 flex items-center gap-2",
          flipLeft && "flex-row-reverse",
        )}
        style={flipLeft ? { right: spaceRight } : { left: pos.left }}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-md mx-0.5 shrink-0 h-8",
            chipClassName,
          )}
          style={{ width: pos.width }}
        >
          <Icon className="size-3.5" />
        </div>
        <span
          className={cn(
            "flex items-center gap-1 text-sm whitespace-nowrap",
            textClassName,
          )}
        >
          <span className={cn(item.isComplete && "line-through opacity-60")}>
            {item.title}
          </span>
          {item.isInternal && <Lock className="size-3.5 shrink-0" />}
        </span>
      </div>
    </ItemHoverCard>
  );
}
