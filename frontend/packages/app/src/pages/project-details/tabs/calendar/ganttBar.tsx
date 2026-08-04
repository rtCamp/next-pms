/**
 * External dependencies.
 */
import type { ComponentType, SVGProps } from "react";
import { Tooltip } from "@rtcamp/frappe-ui-react";
import { Sparkle, Zap } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { COLUMN_WIDTH, MIN_CARD_DAYS } from "./constants";
import type { ProjectTimelineItem } from "./types";

type ItemPosition = { left: number; width: number };

type GanttBarProps = {
  item: ProjectTimelineItem;
  pos: ItemPosition;
  totalWidth: number;
};

// Bars this narrow (a single-day span) can't fit their label inside, so the
// label floats outside the icon chip instead of truncating.
const MIN_BAR_WIDTH = COLUMN_WIDTH * MIN_CARD_DAYS;

type FloatingChipProps = {
  item: ProjectTimelineItem;
  pos: ItemPosition;
  totalWidth: number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  chipClassName: string;
  textClassName: string;
};

// Icon chip + floating label, flipped to the left when near the right edge.
function FloatingChip({
  item,
  pos,
  totalWidth,
  icon: Icon,
  chipClassName,
  textClassName,
}: FloatingChipProps) {
  const spaceRight = totalWidth - (pos.left + pos.width);
  const flipLeft = spaceRight < 150;

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
      <Tooltip text={item.title}>
        <div
          className="absolute top-1/2 -translate-y-1/2 z-1 flex items-center gap-1.5 px-2.5 rounded-md overflow-hidden mx-0.5 bg-surface-blue-2 text-blue-700"
          style={{ left: pos.left, width: pos.width, height: 32 }}
          title={item.title}
        >
          <Sparkle className="size-3.5 shrink-0" />
          <span
            className={`truncate text-sm${item.isComplete ? " line-through opacity-60" : ""}`}
          >
            {item.title}
          </span>
        </div>
      </Tooltip>
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
