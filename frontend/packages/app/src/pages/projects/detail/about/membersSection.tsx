/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { AboutSection } from "./aboutSection";
import { MemberRow } from "./memberRow";
import type { AboutMember } from "./types";

const VISIBLE_MEMBERS = 3;

export function MembersSection({ members }: { members: AboutMember[] }) {
  const visible = members.slice(0, VISIBLE_MEMBERS);
  const remaining = Math.max(0, members.length - VISIBLE_MEMBERS);

  return (
    <AboutSection
      value="members"
      title="Members"
      suffix={
        <Button
          icon={AddSm}
          aria-label="Add member"
          onClick={() => {
            // @todo: open the Add member flow once that's wired (Issue #1227 AC: TBD).
          }}
        />
      }
    >
      <div className="flex flex-col gap-1 px-5 pb-3">
        {visible.map((member) => (
          <MemberRow key={member.email} member={member} />
        ))}
        {remaining > 0 ? (
          <div className="py-1.5 text-base font-light text-ink-gray-5">
            +{remaining} more members
          </div>
        ) : null}
      </div>
    </AboutSection>
  );
}
