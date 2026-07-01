/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { AboutMember } from "../types";
import { MemberHoverCard } from "./memberHoverCard";

export function MemberRow({ member }: { member: AboutMember }) {
  return (
    <MemberHoverCard
      member={member}
      render={
        <div className="flex flex-wrap items-center gap-2 py-1.5 text-base">
          <Avatar
            size="sm"
            label={member.name}
            alt={member.name}
            image={member.image}
          />
          <span className="font-medium text-ink-gray-7">{member.name}</span>
          <span className="flex-1 truncate text-ink-gray-5">
            {member.designation}
          </span>
        </div>
      }
    />
  );
}
