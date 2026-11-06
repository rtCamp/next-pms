/** A field's change in an activity item; values are display text, cut at 40 characters. */
export interface ActivityFieldChange {
  label: string;
  old: string;
  new: string;
}

/** A child table's row counts changed by one save. */
export interface ActivityTableChange {
  label: string;
  added: number;
  removed: number;
  changed: number;
}

interface ActivityBase {
  user: string;
  /** A datetime. */
  timestamp: string;
}

/** One entry of `get_activity`: the creation, the last edit, or a tracked change (a Version). */
export type ActivityItem =
  | (ActivityBase & { type: "created" | "edited" })
  | (ActivityBase & {
      type: "changed";
      changes: ActivityFieldChange[];
      table_changes: ActivityTableChange[];
      impersonated_by: string | null;
    });

export type ActivityUsers = Record<
  string,
  { full_name: string | null; user_image: string | null }
>;

export interface ActivityResponse {
  items: ActivityItem[];
  users: ActivityUsers;
}

/** "You" for the viewer, else the user's full name or ID. */
export function activityName(
  userId: string,
  viewerId: string,
  users: ActivityUsers,
): string {
  return userId === viewerId ? "You" : (users[userId]?.full_name ?? userId);
}

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** A table change as text, e.g. "added 1 row, changed 2 rows in Update Log". */
export function tableChangeText(change: ActivityTableChange): string {
  const parts = [
    change.added && `added ${plural(change.added, "row")}`,
    change.removed && `removed ${plural(change.removed, "row")}`,
    change.changed && `changed ${plural(change.changed, "row")}`,
  ].filter(Boolean);
  return `${parts.join(", ")} in ${change.label}`;
}

/** A key for an item; React's `type-timestamp` repeats when two saves share a second. */
export function activityKey(item: ActivityItem, index: number): string {
  return `${item.type}-${item.timestamp}-${index}`;
}
