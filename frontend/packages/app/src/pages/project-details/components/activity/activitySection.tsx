/**
 * External dependencies.
 */
import { InfoHoverCard, Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { ActivityItem } from "./activityItem";
import { ACTIVITY_HELP } from "./help";
import { useActivity } from "./useActivity";

interface ActivitySectionProps {
  doctype: string;
  name: string;
  modified: string;
}

export function ActivitySection({
  doctype,
  name,
  modified,
}: ActivitySectionProps) {
  const { items, users, isLoading, error } = useActivity(
    doctype,
    name,
    modified,
  );

  return (
    <section>
      <div className="mb-3 flex min-w-0 items-center gap-1.5">
        <h3 className="text-lg font-medium text-ink-gray-7">Activity</h3>
        <InfoHoverCard help={ACTIVITY_HELP} />
      </div>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <p className="text-sm text-ink-red-4">Could not load activity.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-gray-5">No activity yet.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <ActivityItem
              key={`${item.type}-${item.timestamp}`}
              item={item}
              users={users}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
