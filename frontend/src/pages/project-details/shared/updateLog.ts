import { UPDATE_LOG_AUDIT_FIELDS } from "./constants";
import type { UpdateLogRow } from "./types";

type AuditField = (typeof UPDATE_LOG_AUDIT_FIELDS)[number];

/** A row as written back to the server: its name, content fields and audit fields. */
export type UpdateLogPayloadRow<
  Row extends UpdateLogRow,
  Field extends keyof Row,
> = Pick<Row, "name" | Field | AuditField>;

/**
 * An update log as written back on a save, which replaces the whole table: the rows in
 * their stored order (the server takes the last row as the record's current state),
 * each with its name, `fields` and `updated_at` / `updated_by` (dropping `updated_by`
 * would clear it when a System Manager saves).
 */
export function toUpdateLogRows<
  Row extends UpdateLogRow,
  Field extends keyof Row,
>(
  rows: readonly Row[],
  fields: readonly Field[],
): UpdateLogPayloadRow<Row, Field>[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = { name: row.name };
    for (const field of fields) out[field as string] = row[field];
    for (const field of UPDATE_LOG_AUDIT_FIELDS) out[field] = row[field];
    return out as UpdateLogPayloadRow<Row, Field>;
  });
}

/** The update log with a new row appended, which becomes the record's current state. */
export function withAddedUpdate<
  Row extends UpdateLogRow,
  Field extends keyof Row,
>(
  rows: readonly Row[],
  fields: readonly Field[],
  values: Partial<Pick<Row, Field>>,
): Partial<Row>[] {
  return [...toUpdateLogRows(rows, fields), values] as Partial<Row>[];
}

/** The update log with the row named `name` changed in place. */
export function withEditedUpdate<
  Row extends UpdateLogRow,
  Field extends keyof Row,
>(
  rows: readonly Row[],
  fields: readonly Field[],
  name: string,
  values: Partial<Pick<Row, Field>>,
): UpdateLogPayloadRow<Row, Field>[] {
  return toUpdateLogRows(rows, fields).map((row) =>
    row.name === name ? { ...row, ...values } : row,
  );
}

/** The update log without the row named `name`. */
export function withoutUpdate<
  Row extends UpdateLogRow,
  Field extends keyof Row,
>(
  rows: readonly Row[],
  fields: readonly Field[],
  name: string,
): UpdateLogPayloadRow<Row, Field>[] {
  return toUpdateLogRows(
    rows.filter((row) => row.name !== name),
    fields,
  );
}

/** The rows newest first by `updated_at`; rows with the same time keep the later stored row first. */
export function newestFirst<Row extends UpdateLogRow>(
  rows: readonly Row[],
): Row[] {
  return [...rows]
    .reverse()
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
}
