/** A `User`'s display fields. */
export interface UserDetails {
  /** The user ID (email). */
  name: string;
  full_name?: string | null;
  user_image?: string | null;
}

/** A person shown on a record: an owner, a follower, an update's author. */
export interface Person {
  userId: string;
  /** The full name, or the user ID when the user couldn't be read. */
  label: string;
  image?: string;
}

/** A `File` attached to a record. */
export interface FileAttachment {
  name: string;
  file_name: string;
  file_url: string;
  /** Bytes. */
  file_size: number;
}

/** A row of a record's update log (`Risk Update`, `PMS Growth Initiative Update`). */
export interface UpdateLogRow {
  /** Absent on a row about to be added. */
  name?: string;
  /** Datetime, e.g. `"2026-10-23 09:30:00.000000"`; set by the server. */
  updated_at?: string;
  /** User ID; set by the server. */
  updated_by?: string;
  /** HTML. */
  note?: string | null;
}

/** A column of a group list: a fixed minimum width that grows by `flex`. */
export interface GroupColumn<Key extends string = string> {
  key: Key;
  label: string;
  /** CSS length, e.g. `"128px"`. */
  width: string;
  flex: number;
}

/** A collapsible group of a group list. */
export interface RecordGroup<Row, Key extends string = string> {
  /** Accordion value, e.g. `"open"`. */
  value: string;
  label: string;
  columns: GroupColumn<Key>[];
  rows: Row[];
}

/** An owner-gated record's actions the session may take. */
export interface OwnerGatedPermissions {
  canEdit: boolean;
  canDelete: boolean;
}
