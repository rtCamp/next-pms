import type { CSSProperties, MouseEvent } from "react";
import { Badge } from "@rtcamp/frappe-ui-react";
import { Folder } from "lucide-react";
import type { Project } from "./types";
import { mergeClassNames as cn } from "../../utils";

export interface GanttProjectItemProps extends Project {
  onResizeStart?: (e: MouseEvent) => void;
  onResizeHandleEnter?: () => void;
  onResizeHandleLeave?: () => void;
  highlightResizeHandle?: boolean;
  style?: CSSProperties;
}

export function GanttProjectItem({
  name,
  dateRange,
  client,
  badge,
  onResizeStart,
  onResizeHandleEnter,
  onResizeHandleLeave,
  highlightResizeHandle,
  style,
}: GanttProjectItemProps) {
  const subtext = [dateRange, client].filter(Boolean).join(" · ");
  return (
    <th
      className="sticky left-0 z-10 bg-surface-white border-b border-r border-outline-gray-2 pl-8 pr-3 font-normal text-left align-middle flex items-center gap-2 w-full overflow-hidden"
      style={style}
    >
      <div className="w-full flex flex-col gap-1 min-w-0">
        <div className="flex items-center w-full min-w-0 overflow-hidden">
          <Folder size={16} className="shrink-0" />
          <span className="ml-2 text-sm font-medium leading-tight truncate text-ink-gray-8">
            {name}
          </span>
        </div>
        {subtext && (
          <div className="flex items-center flex-1 w-full min-w-0 overflow-hidden pl-6">
            <span className="text-xs leading-tight truncate text-ink-gray-6">
              {subtext}
            </span>
          </div>
        )}
      </div>

      {badge && <Badge label={badge} size="sm" variant="subtle" theme="gray" />}
      {onResizeStart && (
        <div
          className={cn("absolute top-0 right-0 h-full w-1 cursor-col-resize", {
            "bg-outline-gray-3": highlightResizeHandle,
          })}
          onMouseDown={onResizeStart}
          onMouseEnter={onResizeHandleEnter}
          onMouseLeave={onResizeHandleLeave}
        />
      )}
    </th>
  );
}
