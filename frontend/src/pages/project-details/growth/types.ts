import type {
  Person,
  UpdateLogRow,
} from "@/pages/project-details/shared/types";

export type ClientPriority = "" | "Low" | "Medium" | "High";

/** A `PMS Growth Initiative` as the list reads it. */
export interface GrowthRow {
  name: string;
  project: string;
  /** The initiative's title. */
  activity: string;
  /** A `PMS Growth Initiative Category` name. */
  category: string | null;
  client_priority: ClientPriority | null;
  /** A `PMS Growth Initiative Status` of type Status. */
  status: string;
  /** Fetched from the status. */
  is_closed: 0 | 1;
  /** A status of type Closed Status, set while `is_closed`. */
  closed_status: string | null;
  /** A user ID; the owner-gated owner. */
  activity_owner: string | null;
  /** A user ID. */
  ideation_owner: string | null;
  modified: string;
}

/** A row of an initiative's `update_log`. */
export interface GrowthUpdate extends UpdateLogRow {
  name: string;
  status?: string | null;
  closed_status?: string | null;
  client_priority?: ClientPriority | null;
  billable_outcome?: number | null;
  idx?: number;
}

/** A whole initiative, as the detail reads it. */
export interface GrowthDoc extends GrowthRow {
  /** A date, e.g. `"2026-10-26"`. */
  ideation_date: string;
  billable_outcome: number | null;
  /** HTML. */
  description: string | null;
  /** HTML. */
  desired_outcome: string | null;
  owner: string;
  update_log?: GrowthUpdate[];
  linked_todos?: { todo: string }[];
}

/** An initiative in the list, with its activity owner. */
export interface GrowthItem extends GrowthRow {
  ownerPerson: Person | null;
}

/** An update as the detail shows it. */
export interface GrowthUpdateItem extends GrowthUpdate {
  author: Person;
}

/** A `PMS Growth Initiative Status`. */
export interface GrowthStatus {
  name: string;
  status_type: "Status" | "Closed Status";
  is_closed: 0 | 1;
}

/** The toolbar's filters; `""` is "All". */
export interface GrowthFilters {
  activityOwner: string;
  ideationOwner: string;
  status: string;
  category: string;
}

/** The Create / Edit initiative dialog's values. */
export interface GrowthForm {
  activity: string;
  category: string;
  /** HTML. */
  description: string;
  client_priority: ClientPriority;
  status: string;
  closed_status: string;
  /** HTML. */
  desired_outcome: string;
  ideation_date: string;
  activity_owner: string;
  ideation_owner: string;
  /** As typed; `""` for none. */
  billable_outcome: string;
}

export type GrowthFormErrors = Partial<
  Record<
    | "activity"
    | "status"
    | "closed_status"
    | "ideation_date"
    | "billable_outcome",
    string
  >
>;

/** The Add / Edit update dialog's values. */
export interface GrowthUpdateForm {
  status: string;
  closed_status: string;
  client_priority: ClientPriority;
  /** As typed; `""` for unchanged. */
  billable_outcome: string;
  /** HTML. */
  note: string;
}

export type GrowthUpdateErrors = Partial<
  Record<"closed_status" | "billable_outcome" | "note", string>
>;
