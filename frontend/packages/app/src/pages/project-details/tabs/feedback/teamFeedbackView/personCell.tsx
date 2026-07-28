/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { TeamFeedbackRow } from "../types";

export function PersonCell({ person }: { person: TeamFeedbackRow["member"] }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar size="xs" label={person.name} image={person.image} />
      <span className="truncate text-base text-ink-gray-6">{person.name}</span>
    </div>
  );
}
