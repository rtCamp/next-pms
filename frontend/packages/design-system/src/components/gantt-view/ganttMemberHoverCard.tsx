/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";
import { ArrowUpRight, Payments, People, Time, User } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { Member } from "./types";

interface GanttMemberHoverCardProps {
  member: Member;
}

function GanttMemberHoverCard({ member }: GanttMemberHoverCardProps) {
  const hasDetails =
    member.department || member.rate || member.capacity || member.manager;

  return (
    <div className="flex flex-col gap-3 p-3 w-60 rounded-xl shadow-2xl bg-surface-modal">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex gap-2 items-center min-w-0">
          <div className="shrink-0">
            <Avatar size="xl" shape="circle" image={member.image} label={member.name} />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-base font-medium truncate text-ink-gray-7">{member.name}</span>
            {member.designation && (
              <span className="text-sm truncate text-ink-gray-6">{member.designation}</span>
            )}
          </div>
        </div>
        <a
          href="#"
          target="_blank"
          rel="noreferrer"
          className="ml-2 shrink-0 text-ink-gray-6 hover:text-ink-gray-9"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowUpRight className="size-4" />
        </a>
      </div>

      {/* Divider */}
      {hasDetails && <div className="w-full h-px bg-surface-gray-3 shrink-0" />}

      {/* Details */}
      {hasDetails && (
        <div className="flex flex-col gap-2.5">
          {member.department && (
            <div className="flex gap-2 items-center">
              <People className="size-4 text-ink-gray-5 shrink-0" />
              <span className="text-sm text-ink-gray-6">{member.department}</span>
            </div>
          )}
          {member.rate && (
            <div className="flex gap-2 items-center">
              <Payments className="size-4 text-ink-gray-5 shrink-0" />
              <span className="text-sm text-ink-gray-6">{member.rate}</span>
            </div>
          )}
          {member.capacity && (
            <div className="flex gap-2 items-center">
              <Time className="size-4 text-ink-gray-5 shrink-0" />
              <span className="text-sm text-ink-gray-6">{member.capacity}</span>
            </div>
          )}
          {member.manager && (
            <div className="flex gap-2 items-center">
              <User className="size-4 text-ink-gray-5 shrink-0" />
              <span className="text-sm text-ink-gray-6">{member.manager}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GanttMemberHoverCard;
