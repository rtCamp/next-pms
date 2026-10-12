import type { GrowthUpdateEntry } from "../types";

export type GrowthUpdateRow = Pick<
  GrowthUpdateEntry,
  | "name"
  | "status"
  | "closed_status"
  | "client_priority"
  | "billable_outcome"
  | "note"
  | "updated_at"
  | "updated_by"
>;

export const toUpdateLogRows = (
  entries: GrowthUpdateEntry[],
): GrowthUpdateRow[] =>
  entries.map(
    ({
      name,
      status,
      closed_status,
      client_priority,
      billable_outcome,
      note,
      updated_at,
      updated_by,
    }) => ({
      name,
      status,
      closed_status,
      client_priority,
      billable_outcome,
      note,
      updated_at,
      updated_by,
    }),
  );
