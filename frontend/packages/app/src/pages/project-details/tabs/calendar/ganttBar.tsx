/**
 * External dependencies.
 */
import { Diamond, Zap } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { ProjectTimelineItem } from "./types";

type ItemPosition = { left: number; width: number };

type GanttBarProps = {
  item: ProjectTimelineItem;
  pos: ItemPosition;
  totalWidth: number;
};

export function GanttBar({ item, pos, totalWidth }: GanttBarProps) {
  if (item.type === "Milestone") {
    return (
      <div
        className="absolute top-1/2 -translate-y-1/2 z-1 flex items-center gap-1.5 px-2.5 rounded-md overflow-hidden mx-0.5 bg-surface-blue-2 text-blue-700"
        style={{ left: pos.left, width: pos.width, height: 32 }}
        title={item.title}
      >
        <Diamond className="size-3.5 shrink-0" />
        <span className="truncate text-sm">{item.title}</span>
      </div>
    );
  }

  // Touchpoint: icon chip + floating label, flipped to the left when near the right edge
  const spaceRight = totalWidth - (pos.left + pos.width);
  const flipLeft = spaceRight < 150;

  return (
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
      title={item.title}
    >
      <div
        className="flex items-center justify-center rounded-md bg-surface-violet-1 text-violet-700 mx-0.5 shrink-0"
        style={{ width: pos.width, height: 32 }}
      >
        <Zap className="size-3.5" />
      </div>
      <span className="text-sm text-violet-700 whitespace-nowrap">
        {item.title}
      </span>
    </div>
  );
}
