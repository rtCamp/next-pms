import type { CSSProperties } from "react";
import { PreviewCard } from "@base-ui/react/preview-card";
import { Badge } from "@rtcamp/frappe-ui-react";
import { Folder, RightChevron } from "@rtcamp/frappe-ui-react/icons";
import type { Project } from "./types";
import { mergeClassNames as cn } from "../../utils";

export interface GanttProjectItemProps extends Project {
  isExpanded?: boolean;
  canExpand?: boolean;
  showChevron?: boolean;
  onToggle?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function GanttProjectItem({
  name,
  dateRange,
  client,
  badge,
  isExpanded = false,
  canExpand = false,
  showChevron = true,
  onToggle,
  className,
  style,
}: GanttProjectItemProps) {
  const subtext = [dateRange, client].filter(Boolean).join(" · ");

  return (
    // TODO: enable after project hover card implementation.
    <PreviewCard.Root open={false}>
      <PreviewCard.Trigger
        delay={300}
        closeDelay={150}
        render={
          <th
            className={cn(
              "sticky left-0 z-25 bg-surface-white border-b border-r border-outline-gray-1 pr-3 font-normal text-left align-middle flex items-center gap-2 w-full overflow-hidden transition-[height,background-color] cursor-pointer hover:bg-surface-gray-1",
              showChevron ? "pl-3" : "pl-8",
              className,
            )}
            style={style}
          />
        }
      >
        <button
          type="button"
          disabled={!canExpand}
          onClick={() => onToggle?.()}
          className={cn("flex items-center w-full shrink-0", {
            "cursor-default!": !canExpand,
          })}
          aria-expanded={canExpand ? isExpanded : undefined}
        >
          <div className="flex flex-col gap-1 w-full min-w-0">
            <div className="flex gap-1 justify-between items-center w-full">
              <div className="flex overflow-hidden flex-1 items-center w-full min-w-0">
                {showChevron ? (
                  <RightChevron
                    className={cn(
                      "size-4 mr-1 transition-transform duration-150 shrink-0 text-ink-gray-9",
                      { "opacity-0 pointer-events-none": !canExpand },
                      { "rotate-90": isExpanded },
                    )}
                  />
                ) : null}
                <Folder className="size-4 shrink-0" />
                <span className="ml-2 text-base font-medium leading-tight truncate text-ink-gray-9">
                  {name}
                </span>
              </div>
              {badge && (
                <Badge label={badge} size="sm" variant="subtle" theme="gray" />
              )}
            </div>
            <div
              className={cn(
                "flex overflow-hidden flex-1 items-center w-full min-w-0",
                showChevron ? "pl-11" : "pl-6",
              )}
            >
              {subtext && (
                <span className="text-xs leading-tight truncate text-ink-gray-6">
                  {subtext}
                </span>
              )}
            </div>
          </div>
        </button>
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner
          side="right"
          align="center"
          alignOffset={20}
          sideOffset={-42}
        >
          <PreviewCard.Popup className="outline-none">
            <div className="w-60 rounded-xl bg-surface-modal p-3 text-sm text-ink-gray-6 shadow-2xl">
              Project hover card placeholder
            </div>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}
