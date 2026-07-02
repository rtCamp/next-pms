/**
 * External dependencies.
 */
import type { CSSProperties } from "react";
import { PreviewCard } from "@base-ui/react/preview-card";
import { Badge } from "@rtcamp/frappe-ui-react";
import { Folder, RightChevron } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { CELL_HEIGHT } from "./constants";
import GanttProjectHoverCard from "./ganttProjectHoverCard";
import type { Project } from "./types";
import { mergeClassNames as cn } from "../../utils";

export interface GanttProjectItemProps extends Project {
  isExpanded?: boolean;
  canExpand?: boolean;
  showChevron?: boolean;
  showHoverCard?: boolean;
  onToggle?: () => void;
  className?: string;
  style?: CSSProperties;
  contentHeight?: number;
}

export function GanttProjectItem({
  id,
  name,
  dateRange,
  projectDateRange,
  client,
  projectManager,
  weeklyCapacity,
  badge,
  isExpanded = false,
  canExpand = false,
  showChevron = true,
  showHoverCard = true,
  onToggle,
  className,
  style,
  contentHeight = CELL_HEIGHT,
}: GanttProjectItemProps) {
  const subtext = [dateRange, client].filter(Boolean).join(" · ");

  return (
    <PreviewCard.Root open={showHoverCard ? undefined : false}>
      <PreviewCard.Trigger
        delay={300}
        closeDelay={150}
        render={
          <th
            className={cn(
              "sticky left-0 z-25 bg-surface-white border-b border-r border-outline-gray-1 pr-3 font-normal text-left align-middle transition-[height,background-color] cursor-pointer hover:bg-surface-gray-1",
              showChevron ? "pl-3" : "pl-8",
              className,
            )}
            style={style}
          />
        }
      >
        <div
          className="overflow-hidden transition-[height] duration-200 ease-in-out"
          style={{ height: contentHeight }}
        >
          <button
            type="button"
            disabled={!canExpand}
            onClick={() => onToggle?.()}
            className={cn(
              "flex h-full w-full shrink-0 items-center gap-2 overflow-hidden",
              {
                "cursor-default!": !canExpand,
              },
            )}
            aria-expanded={canExpand ? isExpanded : undefined}
          >
            <div className="flex flex-col gap-1 w-full min-w-0">
              <div className="flex gap-1 justify-between items-center w-full">
                <div className="flex overflow-hidden flex-1 items-center w-full min-w-0">
                  {showChevron ? (
                    <RightChevron
                      className={cn(
                        "size-4 mr-1 transition-transform duration-150 shrink-0 text-ink-gray-8",
                        { "opacity-0 pointer-events-none": !canExpand },
                        { "rotate-90": isExpanded },
                      )}
                    />
                  ) : null}
                  <Folder className="size-4 shrink-0" />
                  <span className="ml-2 text-base font-medium truncate text-ink-gray-8">
                    {name}
                  </span>
                </div>
                {badge && (
                  <Badge
                    label={badge}
                    size="sm"
                    variant="subtle"
                    theme="gray"
                  />
                )}
              </div>
              <div
                className={cn(
                  "flex overflow-hidden flex-1 items-center w-full min-w-0",
                  showChevron ? "pl-11" : "pl-6",
                )}
              >
                {subtext && (
                  <span className="text-sm truncate text-ink-gray-6">
                    {subtext}
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner
          side="right"
          align="center"
          alignOffset={20}
          sideOffset={-42}
        >
          <PreviewCard.Popup className="outline-none">
            <GanttProjectHoverCard
              project={{
                id,
                name,
                client,
                dateRange,
                projectDateRange,
                projectManager,
                weeklyCapacity,
              }}
            />
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}
