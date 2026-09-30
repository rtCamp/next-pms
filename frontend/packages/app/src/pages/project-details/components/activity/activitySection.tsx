/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { ActivityItem } from "./activityItem";
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
      <h3 className="mb-3 text-lg font-medium text-ink-gray-7">Activity</h3>
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
