/**
 * External dependencies.
 */
import { PreviewCard } from "@base-ui/react/preview-card";

/**
 * Internal dependencies.
 */
import type { AboutMember } from "../types";
import { MemberHoverCard } from "./memberHoverCard";

export function MemberRoleRow({
  label,
  member,
}: {
  label: string;
  member: AboutMember;
}) {
  return (
    <>
      <span>{label}</span>
      <PreviewCard.Root>
        <PreviewCard.Trigger
          delay={300}
          closeDelay={150}
          render={
            <span className="truncate font-medium text-ink-gray-7">
              {member.name}
            </span>
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
    </>
  );
}
