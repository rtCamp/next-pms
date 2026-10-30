/**
 * External dependencies.
 */
import { Avatar, Tooltip } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { UserDetails } from "@/pages/project-details/types";

interface OwnerPillProps {
  email: string | null;
  details: UserDetails | null;
  role: string;
  tooltip: string;
}

export function OwnerPill({ email, details, role, tooltip }: OwnerPillProps) {
  if (!email) return null;
  const label = details?.full_name ?? email;
  return (
    <Tooltip text={tooltip}>
      <div className="flex items-center gap-1 whitespace-nowrap bg-surface-gray-2 rounded-full px-2 py-1">
        <Avatar
          size="xs"
          shape="circle"
          image={details?.user_image ?? undefined}
          label={label}
        />
        <span>{label}</span>
        <span className="text-ink-gray-5">- {role}</span>
      </div>
    </Tooltip>
  );
}
