/**
 * External dependencies.
 */
import { PreviewCard } from "@base-ui/react/preview-card";
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { AboutMember } from "../types";
import { MemberHoverCard } from "./memberHoverCard";

export function MemberRow({ member }: { member: AboutMember }) {
  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        delay={300}
        closeDelay={150}
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
      <PreviewCard.Portal>
        <PreviewCard.Positioner side="left" align="start" sideOffset={8}>
          <PreviewCard.Popup className="outline-none">
            <MemberHoverCard member={member} />
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}
