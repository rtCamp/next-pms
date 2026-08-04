/**
 * External dependencies.
 */
import type { ComponentType, SVGProps } from "react";
import { Tooltip } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { FLOATING_LABEL_FLIP_THRESHOLD } from "./constants";
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
    <Tooltip text={item.title}>
      <div
        className="absolute top-1/2 -translate-y-1/2 z-1 flex items-center gap-2"
        style={
          flipLeft
            ? {
                right: totalWidth - (pos.left + pos.width),
                flexDirection: "row-reverse",
              }
            : { left: pos.left }
        }
      >
        <div
          className={`flex items-center justify-center rounded-md mx-0.5 shrink-0 ${chipClassName}`}
          style={{ width: pos.width, height: 32 }}
        >
          <Icon className="size-3.5" />
        </div>
        <span
          className={`text-sm whitespace-nowrap ${textClassName}${item.isComplete ? " line-through opacity-60" : ""}`}
        >
          {item.title}
        </span>
      </div>
    </Tooltip>
  );
}
