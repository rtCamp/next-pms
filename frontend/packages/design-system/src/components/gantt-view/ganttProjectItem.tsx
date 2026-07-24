/**
 * External dependencies.
 */
import { useId, type CSSProperties } from "react";
import { Popover } from "@base-ui/react/popover";
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
  hasRoleAccess?: boolean;
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
  hasRoleAccess = false,
  onToggle,
  className,
  style,
  contentHeight = CELL_HEIGHT,
}: GanttProjectItemProps) {
  const triggerId = useId();
  const subtext = [dateRange, client].filter(Boolean).join(" · ");

  return (
    <th
      className={cn(
        "sticky left-0 z-25 bg-surface-white border-b border-r border-outline-gray-1 font-normal text-left align-middle transition-[height,background-color] hover:bg-surface-gray-1",
        className,
      )}
      style={style}
    >
      <Popover.Root open={showHoverCard ? undefined : false}>
        <div
          className="relative overflow-hidden transition-[height] duration-200 ease-in-out"
          style={{ height: contentHeight }}
        >
          {/* Mouse-only trigger */}
          <Popover.Trigger
            id={`${triggerId}-cell`}
            openOnHover
            delay={300}
            closeDelay={150}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (canExpand) onToggle?.();
            }}
            render={<button type="button" />}
            className={cn(
              "absolute inset-0 z-10 focus:outline-none",
              canExpand ? "cursor-pointer" : "cursor-default",
            )}
          />
          <div
            className={cn(
              "flex pr-3 h-full w-full shrink-0 items-center overflow-hidden",
              showChevron ? "pl-3" : "pl-8",
            )}
          >
            <div className="flex flex-col gap-1 w-full min-w-0">
              <div className="flex gap-1 justify-between items-center w-full">
                <div className="flex flex-1 items-center w-full min-w-0">
                  {showChevron ? (
                    <button
                      type="button"
                      disabled={!canExpand}
                      onClick={() => onToggle?.()}
                      aria-expanded={canExpand ? isExpanded : undefined}
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                      className={cn(
                        "mr-1 shrink-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3",
                        { "opacity-0 pointer-events-none": !canExpand },
                      )}
                    >
                      <RightChevron
                        className={cn(
                          "size-4 transition-transform duration-150 text-ink-gray-8",
                          { "rotate-90": isExpanded },
                        )}
                      />
                    </button>
                  ) : null}
                  <Folder className="size-4 shrink-0" />
                  {showHoverCard ? (
                    <Popover.Trigger
                      id={`${triggerId}-name`}
                      nativeButton={false}
                      aria-label={`View ${name} details`}
                      render={<span />}
                      className="ml-2 rounded-sm text-base font-medium text-left truncate text-ink-gray-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
                    >
                      {name}
                    </Popover.Trigger>
                  ) : (
                    <span className="ml-2 text-base font-medium truncate text-ink-gray-8">
                      {name}
                    </span>
                  )}
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
          </div>
        </div>
        <Popover.Portal>
          <Popover.Positioner
            side="right"
            align="center"
            alignOffset={20}
            sideOffset={-42}
          >
            <Popover.Popup initialFocus={false} className="z-50 outline-none">
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
                canOpenProject={hasRoleAccess}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </th>
  );
}
