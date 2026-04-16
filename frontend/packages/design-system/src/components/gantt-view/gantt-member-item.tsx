import { Avatar, Badge } from "@rtcamp/frappe-ui-react";
import { ChevronRight } from "lucide-react";
import { CELL_HEIGHT } from "./constants";
import { useGanttStore } from "./gantt-store";
import { mergeClassNames as cn } from "../../utils";

export interface GanttMemberItemProps {
  memberInd: number;
}

export function GanttMemberItem({ memberInd }: GanttMemberItemProps) {
  const { members, expandedRows, toggleRow, headerWidth, hasRoleAccess } =
    useGanttStore((s) => ({
      members: s.members,
      expandedRows: s.expandedRows,
      headerWidth: s.headerWidth,
      toggleRow: s.toggleRow,
      hasRoleAccess: s.hasRoleAccess,
    }));
  const member = members[memberInd];
  const isExpanded = expandedRows.has(memberInd);
  const hasProjects = Boolean(member.projects?.length);
  const canExpand = hasProjects || hasRoleAccess;

  return (
    <th
      className="sticky left-0 z-10 flex items-center w-full p-3 overflow-hidden font-normal text-left align-middle border-b border-r bg-surface-white border-outline-gray-1"
      style={{
        height: CELL_HEIGHT,
        width: headerWidth,
      }}
    >
      <button
        onClick={() => toggleRow(memberInd)}
        className={cn("shrink-0 w-full flex items-center", {
          "pointer-events-none": !canExpand,
        })}
        aria-label={isExpanded ? "Collapse" : "Expand"}
      >
        <div className="w-full flex flex-col gap-1 min-w-0">
          <div className="flex items-center justify-between gap-1 w-full">
            <div className="flex items-center flex-1 w-full min-w-0 overflow-hidden">
              <ChevronRight
                className={cn(
                  "shrink-0 mr-1 text-ink-gray-9 transition-transform duration-150",
                  { "opacity-0 pointer-events-none": !canExpand },
                  { "rotate-90": isExpanded },
                )}
                size={16}
              />
              <Avatar
                size="xs"
                shape="circle"
                image={member.image}
                label={member.name}
              />
              <span className="ml-2 text-base font-medium leading-tight truncate text-ink-gray-9">
                {member.name}
              </span>
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
          </div>
          <div className="flex items-center flex-1 w-full min-w-0 overflow-hidden pl-11">
            {member.role && (
              <span className="text-xs leading-tight truncate text-ink-gray-6">
                {member.role}
              </span>
            )}
          </div>
        </div>
      </button>
    </th>
  );
}
