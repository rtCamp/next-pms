/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { UserDetails } from "@/pages/project-details/types";

interface UserCellProps {
  email: string | null;
  details?: UserDetails | null;
}

export function UserCell({ email, details }: UserCellProps) {
  if (!email) return <span>—</span>;
  const label = details?.full_name ?? email;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar
        size="xs"
        shape="circle"
        image={details?.user_image ?? undefined}
        label={label}
      />
      <span className="truncate">{label}</span>
    </div>
  );
}
