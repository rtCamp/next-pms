/**
 * External dependencies.
 */
import { useId, type CSSProperties } from "react";
import { Popover } from "@base-ui/react/popover";
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
  buttonClassName?: string;
  style?: CSSProperties;
  contentHeight?: number;
}

export function GanttMemberItem({
  memberInd,
  member: memberProp,
  isExpanded: isExpandedProp,
  canExpand: canExpandProp,
  showChevron = true,
  onToggle,
  className,
  buttonClassName,
  style,
  contentHeight = CELL_HEIGHT,
}: GanttMemberItemProps) {
  const { members, expandedRows, toggleRow, headerWidth, hasRoleAccess } =
    useGanttStore((s) => ({
      members: s.members,
      expandedRows: s.expandedRows,
      headerWidth: s.headerWidth,
      toggleRow: s.toggleRow,
      hasRoleAccess: s.hasRoleAccess,
    }));

  const triggerId = useId();
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
    <th
      className={cn(
        "sticky left-0 z-25 bg-surface-white border-b border-r border-outline-gray-1 font-normal text-left align-middle transition-[height,background-color] hover:bg-surface-gray-1",
        className,
      )}
      style={{
        width: headerWidth,
        minWidth: headerWidth,
        maxWidth: headerWidth,
        ...style,
      }}
    >
      <Popover.Root>
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
            onClick={(e) => {
              e.preventBaseUIHandler();
              if (canExpand) handleToggle?.();
            }}
            render={<button type="button" />}
            className={cn(
              "absolute inset-0 z-10 focus:outline-none",
              canExpand ? "cursor-pointer" : "cursor-default",
            )}
          />
          <div
            className={cn(
              "flex pl-3 pr-3 h-full w-full shrink-0 items-center overflow-hidden",
              buttonClassName,
            )}
          >
            <div className="flex flex-col gap-1 w-full min-w-0">
              <div className="flex gap-1 justify-between items-center w-full">
                <div className="flex flex-1 items-center w-full min-w-0">
                  {showChevron ? (
                    <button
                      type="button"
                      disabled={!canExpand}
                      onClick={() => handleToggle?.()}
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
                  <Avatar
                    size="xs"
                    shape="circle"
                    image={member.image}
                    label={member.name}
                  />
                  <Popover.Trigger
                    id={`${triggerId}-name`}
                    nativeButton={false}
                    aria-label={`View ${member.name} details`}
                    render={<span />}
                    className="ml-2 rounded-sm text-base font-medium text-left truncate text-ink-gray-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
                  >
                    {member.name}
                  </Popover.Trigger>
                </div>
                {member.badge && (
                  <Badge
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
                  <span className="text-sm truncate text-ink-gray-6">
                    {member.designation}
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
              <GanttMemberHoverCard
                member={member}
                canOpenEmployee={hasRoleAccess}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </th>
  );
}
