/**
 * External dependencies.
 */
import { Fragment } from "react";
import { formatRelativeTimeShort } from "@next-pms/design-system/utils";

/**
 * Internal dependencies.
 */
import { useUser } from "@/providers/user";
import type { ActivityItem as ActivityItemData, ActivityUsers } from "./types";

interface ActivityItemProps {
  item: ActivityItemData;
  users: ActivityUsers;
}

const SEPARATOR = " · ";

function pluralize(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function ActivityItem({ item, users }: ActivityItemProps) {
  const userId = useUser(({ state }) => state.userId);
  const displayName = (user: string) =>
    user === userId ? "You" : (users[user]?.full_name ?? user);

  return (
    <li className="relative pb-4 pl-4 ml-1 border-l border-outline-gray-1 last:border-transparent last:pb-0">
      <span className="absolute -left-[4.5px] top-2 size-2 rounded-full bg-surface-gray-5" />
      <p className="text-base text-ink-gray-6 leading-relaxed">
        {item.type === "created" && `${displayName(item.user)} created this`}
        {item.type === "edited" && `${displayName(item.user)} last edited this`}
        {item.type === "changed" && (
          <>
            {`${displayName(item.user)} `}
            {item.changes.length > 0 && "changed the value of "}
            {item.changes.map((change, index) => (
              <Fragment key={change.label}>
                {index > 0 && ", "}
                {`${change.label} from `}
                <span className="font-medium text-ink-gray-8">
                  {change.old || '""'}
                </span>
                {" to "}
                <span className="font-medium text-ink-gray-8">
                  {change.new || '""'}
                </span>
              </Fragment>
            ))}
            {item.table_changes.map((table, index) => (
              <Fragment key={table.label}>
                {(index > 0 || item.changes.length > 0) && ", "}
                {[
                  table.added && `added ${pluralize(table.added, "row")}`,
                  table.removed && `removed ${pluralize(table.removed, "row")}`,
                  table.changed && `changed ${pluralize(table.changed, "row")}`,
                ]
                  .filter(Boolean)
                  .join(", ")}
                {` in ${table.label}`}
              </Fragment>
            ))}
            {item.impersonated_by && (
              <>
                {SEPARATOR}
                <span className="font-medium text-ink-gray-8">
                  Impersonated by {displayName(item.impersonated_by)}
                </span>
              </>
            )}
          </>
        )}
        {SEPARATOR}
        {formatRelativeTimeShort(item.timestamp, new Date(), true)}
      </p>
    </li>
  );
}
