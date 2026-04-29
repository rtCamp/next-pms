import { PreviewCard } from "@base-ui/react/preview-card";
import { Avatar, Badge } from "@rtcamp/frappe-ui-react";
import { ChevronRight } from "lucide-react";
import { CELL_HEIGHT } from "./constants";
import GanttMemberHoverCard from "./ganttMemberHoverCard";
import { useGanttStore } from "./ganttStore";
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
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={300}
        closeDelay={150}
        render={
          <th
            className="flex overflow-hidden sticky left-0 z-10 items-center p-3 w-full font-normal text-left align-middle border-r border-b transition-colors duration-150 cursor-pointer bg-surface-white border-outline-gray-1 hover:bg-surface-gray-1"
            style={{
              height: CELL_HEIGHT,
              width: headerWidth,
            }}
          />
        }
      >
        <button
          disabled={!canExpand}
          onClick={() => toggleRow(memberInd)}
          className={cn("flex items-center w-full shrink-0", {
            "cursor-default!": !canExpand,
          })}
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <div className="flex flex-col gap-1 w-full min-w-0">
            <div className="flex gap-1 justify-between items-center w-full">
              <div className="flex overflow-hidden flex-1 items-center w-full min-w-0">
                <ChevronRight
                  className={cn(
                    "mr-1 transition-transform duration-150 shrink-0 text-ink-gray-9",
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
            <div className="flex overflow-hidden flex-1 items-center pl-11 w-full min-w-0">
              {member.designation && (
                <span className="text-xs leading-tight truncate text-ink-gray-6">
                  {member.designation}
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
            <GanttMemberHoverCard member={member} />
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}
