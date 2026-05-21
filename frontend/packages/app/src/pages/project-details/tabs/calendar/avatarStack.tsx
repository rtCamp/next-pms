/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { UserRef } from "./types";

type AvatarStackProps = {
  users: UserRef[];
  max?: number;
};

export function AvatarStack({ users, max = 4 }: AvatarStackProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex -space-x-1 items-center">
      {visible.map((user, index) => (
        <div
          key={user.name}
          className="ring-1 ring-white rounded-full"
          title={user.fullName}
          style={{ zIndex: visible.length - index }}
        >
          <Avatar
            size="xs"
            label={user.fullName}
            image={user.avatar}
            shape="circle"
          />
        </div>
      ))}
      {overflow > 0 && (
        <div className="size-4 rounded-full bg-surface-gray-2 ring-1 ring-white flex items-center justify-center text-[8px] text-ink-gray-5 font-medium">
          +{overflow}
        </div>
      )}
    </div>
  );
}
