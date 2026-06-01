/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";
import {
  Call,
  Email,
  Payments,
  RightChevron,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import type { AboutMember } from "../types";

export function MemberHoverCard({ member }: { member: AboutMember }) {
  console.log(member);

  const userPath = member.email
    ? `/desk/user/${encodeURIComponent(member.email)}`
    : undefined;

  const email = member.companyEmail || member.email;

  return (
    <div className="flex w-64 flex-col gap-3 rounded-xl bg-surface-modal p-3 shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            size="xl"
            shape="circle"
            image={member.image}
            label={member.name}
            alt={member.name}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-base font-medium text-ink-gray-7">
              {member.name}
            </span>
            {member.designation && (
              <span className="truncate text-sm font-light text-ink-gray-6">
                {member.designation}
              </span>
            )}
          </div>
        </div>
        {userPath && (
          <a
            href={userPath}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${member.name}`}
            className="shrink-0 text-ink-gray-6 hover:text-ink-gray-9"
            onClick={(event) => event.stopPropagation()}
          >
            <RightChevron className="size-4" />
          </a>
        )}
      </div>

      <div className="h-px w-full bg-outline-gray-1" />
      <div className="flex flex-col gap-2.5">
        {member.department !== undefined && (
          <div className="flex items-center gap-2">
            <Payments className="size-4 shrink-0 text-ink-gray-5" />

            <span className="block truncate text-ink-gray-7 text-base">
              {member.department}
            </span>
          </div>
        )}
        {member.rate !== undefined && (
          <div className="flex items-center gap-2">
            <Payments className="size-4 shrink-0 text-ink-gray-5" />

            <span className="block truncate text-ink-gray-7 text-base">
              {currencyFormat(member.currency).format(member.rate)}/hour
            </span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2">
            <Email className="size-4 shrink-0 text-ink-gray-5" />
            <span className="truncate text-sm font-light text-ink-gray-6">
              {email}
            </span>
          </div>
        )}
        {member.phone && (
          <div className="flex items-center gap-2">
            <Call className="size-4 shrink-0 text-ink-gray-5" />
            <span className="truncate text-sm font-light text-ink-gray-6">
              {member.phone}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
