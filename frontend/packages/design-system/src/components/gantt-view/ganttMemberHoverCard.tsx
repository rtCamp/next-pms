/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";
import {
  AgentAlt,
  ArrowUpRight,
  Payments,
  People,
  Time,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { Member, ProjectMember } from "./types";
import { mergeClassNames as cn } from "../../utils";

interface GanttMemberHoverCardProps {
  member: Member | ProjectMember;
  canOpenEmployee?: boolean;
}

function GanttMemberHoverCard({
  member,
  canOpenEmployee = false,
}: GanttMemberHoverCardProps) {
  const hasDetails =
    member.department || member.rate || member.capacity || member.manager;
  const employeeHref =
    canOpenEmployee && member.id
      ? `/desk/employee/${encodeURIComponent(member.id)}`
      : undefined;

  return (
    <div className="flex flex-col gap-3 p-3 w-60 rounded-xl shadow-2xl bg-surface-modal">
      {/* Header */}
      <div
        className={cn("flex items-start", {
          "justify-between": employeeHref,
        })}
      >
        <div className="flex gap-2 items-center min-w-0">
          <div className="shrink-0">
            <Avatar
              size="xl"
              shape="circle"
              image={member.image}
              label={member.name}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-base font-medium truncate text-ink-gray-7">
              {member.name}
            </span>
            {member.designation && (
              <span className="text-sm truncate text-ink-gray-6">
                {member.designation}
              </span>
            )}
          </div>
        </div>
        {employeeHref && (
          <a
            href={employeeHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Open employee"
            className="ml-2 shrink-0 text-ink-gray-8 hover:text-ink-gray-8"
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowUpRight className="size-4 text-ink-gray-8 shrink-0" />
          </a>
        )}
      </div>

      {/* Divider */}
      {hasDetails && <div className="w-full h-px bg-surface-gray-3 shrink-0" />}

      {/* Details */}
      {hasDetails && (
        <div className="flex flex-col gap-2.5">
          {member.department && (
            <div className="flex gap-2 items-center">
              <People className="size-4 text-ink-gray-6 shrink-0" />
              <span className="text-sm text-ink-gray-6 truncate">
                {member.department}
              </span>
            </div>
          )}
          {member.rate && (
            <div className="flex gap-2 items-center">
              <Payments className="size-4 text-ink-gray-6 shrink-0" />
              <span className="text-sm text-ink-gray-6 truncate">
                {member.rate}
              </span>
            </div>
          )}
          {member.capacity && (
            <div className="flex gap-2 items-center">
              <Time className="size-4 text-ink-gray-6 shrink-0" />
              <span className="text-sm text-ink-gray-6 truncate">
                {member.capacity}
              </span>
            </div>
          )}
          {member.manager && (
            <div className="flex gap-2 items-center">
              <AgentAlt className="size-4 text-ink-gray-6 shrink-0" />
              <span className="text-sm text-ink-gray-6 truncate">
                {member.manager}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GanttMemberHoverCard;
