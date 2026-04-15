import type { MouseEvent } from "react";
import { Avatar, Badge } from "@rtcamp/frappe-ui-react";
import { ChevronRight } from "lucide-react";
import { CELL_HEIGHT } from "./constants";
import { useGanttStore } from "./gantt-store";
import { mergeClassNames as cn } from "../../utils";

export interface GanttMemberItemProps {
  memberInd: number;
  onResizeStart?: (e: MouseEvent) => void;
  onResizeHandleEnter?: () => void;
  onResizeHandleLeave?: () => void;
  highlightResizeHandle?: boolean;
}

export function GanttMemberItem({
  memberInd,
  onResizeStart,
  onResizeHandleEnter,
  onResizeHandleLeave,
  highlightResizeHandle,
}: GanttMemberItemProps) {
  const { members, expandedRows, toggleRow, headerWidth } = useGanttStore(
    (s) => ({
      members: s.members,
      expandedRows: s.expandedRows,
      headerWidth: s.headerWidth,
      toggleRow: s.toggleRow,
    }),
  );
  const member = members[memberInd];
  const isExpanded = expandedRows.has(memberInd);
  const hasProjects = Boolean(member.projects?.length);

  return (
    <th
      className="sticky left-0 z-10 flex items-center w-full p-3 overflow-hidden font-normal text-left align-middle border-b border-r bg-surface-white border-outline-gray-2"
      style={{
        height: CELL_HEIGHT,
        width: headerWidth,
      }}
    >
      <div className="w-full flex flex-col gap-1 min-w-0">
        <div className="flex items-center flex-1 w-full min-w-0 overflow-hidden">
          <button
            onClick={() => toggleRow(memberInd)}
            className={cn(
              "shrink-0 mr-1 text-ink-gray-4 transition-transform duration-150",
              { "opacity-0 pointer-events-none": !hasProjects },
              { "rotate-90": isExpanded },
            )}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronRight size={16} />
          </button>
          <Avatar
            size="xs"
            shape="circle"
            image={member.image}
            label={member.name}
          />
          <span className="ml-2 text-sm font-medium leading-tight truncate text-ink-gray-8">
            {member.name}
          </span>
        </div>
        <div className="flex items-center flex-1 w-full min-w-0 overflow-hidden pl-11">
          {member.role && (
            <span className="text-xs leading-tight truncate text-ink-gray-6">
              {member.role}
            </span>
          )}
        </div>
      </div>

      {member.badge && (
        <Badge
          className=""
          label={member.badge}
          size="sm"
          variant="subtle"
          theme="gray"
        />
      )}
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
