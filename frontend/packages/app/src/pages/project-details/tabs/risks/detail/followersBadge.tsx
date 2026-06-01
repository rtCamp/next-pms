/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { Follower } from "../types";

const MAX_VISIBLE = 3;

interface FollowersBadgeProps {
  followers: Follower[];
}

export function FollowersBadge({ followers }: FollowersBadgeProps) {
  if (followers.length === 0) return null;

  const visible = followers.slice(0, MAX_VISIBLE);
  const count = followers.length;

  return (
    <div className="flex items-center gap-1 bg-surface-gray-2 rounded-full px-2 py-1 text-sm text-ink-gray-7">
      <div className="flex items-center">
        {visible.map((follower, index) => (
          <div
            key={follower.user}
            className="outline-1 outline-surface-gray-4 rounded-full -mr-1 last:mr-0"
            style={{ zIndex: MAX_VISIBLE - index }}
          >
            <Avatar
              size="xs"
              shape="circle"
              image={follower.user_image ?? undefined}
              label={follower.full_name ?? follower.user}
            />
          </div>
        ))}
      </div>
      <span className="pl-1">
        {count} {count === 1 ? "watcher" : "watchers"}
      </span>
    </div>
  );
}
