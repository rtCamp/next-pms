/**
 * External dependencies.
 */
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { ColorAvatar } from "./colorAvatar";
import type { AboutMember } from "./types";

export function MemberRow({ member }: { member: AboutMember }) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          tabIndex={0}
          role="button"
          aria-label={`${member.name}, ${member.designation}`}
          className="flex cursor-default items-center gap-2 rounded-sm py-1.5 outline-none focus-visible:ring focus-visible:ring-outline-gray-3"
        >
          <ColorAvatar
            initials={member.initials}
            color={member.avatarColor}
            alt={`${member.name} avatar`}
          />
          <div className="flex min-w-0 flex-1 items-center gap-1 text-base">
            <span className="truncate font-medium text-ink-gray-7">
              {member.name}
            </span>
            <span className="flex-1 truncate font-light text-ink-gray-5">
              · {member.designation}
            </span>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 text-sm">
        <div className="flex items-center gap-2">
          <ColorAvatar
            initials={member.initials}
            color={member.avatarColor}
            alt=""
          />
          <span className="font-semibold text-ink-gray-8">{member.name}</span>
        </div>
        <p className="mt-1 text-ink-gray-6">{member.designation}</p>
        <a
          href={`mailto:${member.email}`}
          className="mt-2 block truncate text-ink-blue-3 hover:underline"
        >
          {member.email}
        </a>
        {member.phone ? (
          <p className="mt-1 text-ink-gray-6">{member.phone}</p>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}
