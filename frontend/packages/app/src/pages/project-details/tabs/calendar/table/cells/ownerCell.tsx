/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { UserRef } from "../../types";

export function OwnerCell({ owner }: { owner: UserRef }) {
  return (
    <div className="flex items-center gap-1.5">
      <Avatar
        size="xs"
        shape="circle"
        label={owner.fullName}
        image={owner.avatar}
      />
      <span>{owner.fullName}</span>
    </div>
  );
}
