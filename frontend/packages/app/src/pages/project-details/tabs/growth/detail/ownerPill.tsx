/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { UserDetails } from "../../risks/types";

interface OwnerPillProps {
  email: string | null;
  details: UserDetails | null;
  role: string;
}

export function OwnerPill({ email, details, role }: OwnerPillProps) {
  if (!email) return null;
  const label = details?.full_name ?? email;
  return (
    <div
      className="flex items-center gap-1 bg-surface-gray-2 rounded-full px-2 py-1"
      title={role}
    >
      <Avatar
        size="xs"
        shape="circle"
        image={details?.user_image ?? undefined}
        label={label}
      />
      <span>{label}</span>
      <span className="text-ink-gray-5">- {role}</span>
    </div>
  );
}
