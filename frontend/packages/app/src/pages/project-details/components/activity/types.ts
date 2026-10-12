export interface ActivityFieldChange {
  label: string;
  old: string;
  new: string;
}

export interface ActivityTableChange {
  label: string;
  added: number;
  removed: number;
  changed: number;
}

interface ActivityItemBase {
  user: string;
  timestamp: string;
}

export interface ActivityCreatedItem extends ActivityItemBase {
  type: "created";
}

export interface ActivityEditedItem extends ActivityItemBase {
  type: "edited";
}

export interface ActivityChangedItem extends ActivityItemBase {
  type: "changed";
  changes: ActivityFieldChange[];
  table_changes: ActivityTableChange[];
  impersonated_by: string | null;
}

export type ActivityItem =
  ActivityCreatedItem | ActivityEditedItem | ActivityChangedItem;

export type ActivityUsers = Record<
  string,
  { full_name: string | null; user_image: string | null }
>;

export interface ActivityResponse {
  items: ActivityItem[];
  users: ActivityUsers;
}
