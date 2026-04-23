import type { CSSProperties } from "react";
import { Badge } from "@rtcamp/frappe-ui-react";
import { Folder } from "lucide-react";
import type { Project } from "./types";

export interface GanttProjectItemProps extends Project {
  style?: CSSProperties;
}

export function GanttProjectItem({
  name,
  dateRange,
  client,
  badge,
  style,
}: GanttProjectItemProps) {
  const subtext = [dateRange, client].filter(Boolean).join(" · ");
  return (
    <th
      className="sticky left-0 z-10 bg-surface-white border-b border-r border-outline-gray-1 pl-8 pr-3 font-normal text-left align-middle flex items-center gap-2 w-full overflow-hidden transition-[height] duration-200 ease-in-out"
      style={style}
    >
      <div className="w-full flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between gap-1 w-full">
          <div className="flex items-center w-full min-w-0 overflow-hidden">
            <Folder size={16} className="shrink-0" />
            <span className="ml-2 text-base font-medium leading-tight truncate text-ink-gray-9">
              {name}
            </span>
          </div>
          {badge && (
            <Badge label={badge} size="sm" variant="subtle" theme="gray" />
          )}
        </div>
        {subtext && (
          <div className="flex items-center flex-1 w-full min-w-0 overflow-hidden pl-6">
            <span className="text-xs leading-tight truncate text-ink-gray-6">
              {subtext}
            </span>
          </div>
        )}
      </div>
    </th>
  );
}
