/**
 * External dependencies.
 */
import type { CSSProperties } from "react";
import { PreviewCard } from "@base-ui/react/preview-card";
import { Avatar, Badge } from "@rtcamp/frappe-ui-react";
import { RightChevron } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { CELL_HEIGHT } from "./constants";
import GanttMemberHoverCard from "./ganttMemberHoverCard";
import { useGanttStore } from "./ganttStore";
import type { Member, ProjectMember } from "./ganttStore";
import { mergeClassNames as cn } from "../../utils";

export interface GanttMemberItemProps {
  memberInd?: number;
  member?: Member | ProjectMember;
  isExpanded?: boolean;
  canExpand?: boolean;
  showChevron?: boolean;
  onToggle?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function GanttMemberItem({
  memberInd,
  member: memberProp,
  isExpanded: isExpandedProp,
  canExpand: canExpandProp,
  showChevron = true,
  onToggle,
  className,
  style,
}: GanttMemberItemProps) {
  const { members, expandedRows, toggleRow, headerWidth, hasRoleAccess } =
    useGanttStore((s) => ({
      members: s.members,
      expandedRows: s.expandedRows,
      headerWidth: s.headerWidth,
      toggleRow: s.toggleRow,
      hasRoleAccess: s.hasRoleAccess,
    }));

  const hasMemberIndex = memberInd !== undefined;
  const storeMember = hasMemberIndex ? members[memberInd] : undefined;
  const member = memberProp ?? storeMember;

  if (!member) return null;

  const isExpanded =
    isExpandedProp ?? (hasMemberIndex && expandedRows.has(memberInd));
  const hasProjects = "projects" in member && Boolean(member.projects?.length);
  const canExpand = canExpandProp ?? (hasProjects || hasRoleAccess);
  const handleToggle =
    onToggle ?? (hasMemberIndex ? () => toggleRow(memberInd) : undefined);

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={300}
        closeDelay={150}
        render={
          <th
            className={cn(
              "sticky left-0 z-25 bg-surface-white border-b border-r border-outline-gray-1 pl-3 pr-3 font-normal text-left align-middle flex items-center gap-2 w-full overflow-hidden transition-[height,background-color] cursor-pointer hover:bg-surface-gray-1",
              className,
            )}
            style={{
              height: CELL_HEIGHT,
              width: headerWidth,
              ...style,
            }}
          />
        }
      >
        <button
          type="button"
          disabled={!canExpand}
          onClick={() => handleToggle?.()}
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
                      "size-4 mr-1 transition-transform duration-150 shrink-0 text-ink-gray-8",
                      { "opacity-0 pointer-events-none": !canExpand },
                      { "rotate-90": isExpanded },
                    )}
                  />
                ) : null}
                <Avatar
                  size="xs"
                  shape="circle"
                  image={member.image}
                  label={member.name}
                />
                <span className="ml-2 text-base font-medium leading-tight truncate text-ink-gray-8">
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
            <div
              className={cn(
                "flex overflow-hidden flex-1 items-center w-full min-w-0",
                showChevron ? "pl-11" : "pl-6",
              )}
            >
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
