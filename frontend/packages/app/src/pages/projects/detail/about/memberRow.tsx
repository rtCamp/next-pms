/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { AboutMember } from "./types";

export function MemberRow({ member }: { member: AboutMember }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Avatar size="sm" label={member.name} alt={member.name} />
      <div className="flex min-w-0 flex-1 items-center gap-1 text-base">
        <span className="truncate font-medium text-ink-gray-7">
          {member.name}
        </span>
        <span className="flex-1 truncate font-light text-ink-gray-5">
          · {member.designation}
        </span>
      </div>
    </div>
  );
}
