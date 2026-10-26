/** The `Timesheet Settings` single doctype: timesheet and resource management defaults. */
export interface SystemSettings {
  name: string;
  allow_backdated_entries?: 0 | 1;
  allow_backdated_entries_till_employee?: number;
  allow_backdated_entries_till_manager?: number;
  ignored_role?: { role?: string }[];
  allow_future_entries?: 0 | 1;
  allow_weekend_entries?: 0 | 1;
  auto_expand_weeks_by_default?: number;
  send_daily_reminder?: 0 | 1;
  daily_reminder_template?: string | null;
  send_reminder_on_approval_request?: 0 | 1;
  approval_request_reminder_template?: string | null;
  timesheet_approval_template?: string | null;
  timesheet_rejection_template?: string | null;
  send_weekly_approval_reminder?: 0 | 1;
  day_to_send_reminder?: string;
  weekly_approval_reminder_template?: string | null;
  allowed_departments?: { department?: string }[];
  send_missing_allocation_reminder?: 0 | 1;
  remind_on?: string;
  allocation_email_template?: string | null;
  designations?: { designation?: string }[];
  default_currency?: string | null;
}

/** The fields the Settings dialog edits; anything else on the doc is never sent. */
export const SYSTEM_SETTINGS_FIELDS = [
  "allow_backdated_entries",
  "allow_backdated_entries_till_employee",
  "allow_backdated_entries_till_manager",
  "ignored_role",
  "allow_future_entries",
  "allow_weekend_entries",
  "auto_expand_weeks_by_default",
  "send_daily_reminder",
  "daily_reminder_template",
  "send_reminder_on_approval_request",
  "approval_request_reminder_template",
  "timesheet_approval_template",
  "timesheet_rejection_template",
  "send_weekly_approval_reminder",
  "day_to_send_reminder",
  "weekly_approval_reminder_template",
  "allowed_departments",
  "send_missing_allocation_reminder",
  "remind_on",
  "allocation_email_template",
  "designations",
  "default_currency",
] as const satisfies readonly (keyof SystemSettings)[];

export type SystemSettingsForm = Pick<
  SystemSettings,
  (typeof SYSTEM_SETTINGS_FIELDS)[number]
>;

/** A child table as the values of one column, e.g. `ignored_role` → role names. */
export function tableValues<T>(
  rows: T[] | undefined,
  column: keyof T,
): string[] {
  return (rows ?? [])
    .map((row) => row[column])
    .filter(
      (value): value is T[keyof T] & string =>
        typeof value === "string" && value !== "",
    );
}

/** The form's fields from a loaded doc, child tables reduced to their one column. */
export function toForm(doc: SystemSettings): SystemSettingsForm {
  const form: SystemSettingsForm = {};
  for (const field of SYSTEM_SETTINGS_FIELDS) {
    (form as Record<string, unknown>)[field] = doc[field];
  }
  form.ignored_role = tableValues(doc.ignored_role, "role").map((role) => ({
    role,
  }));
  form.allowed_departments = tableValues(
    doc.allowed_departments,
    "department",
  ).map((department) => ({ department }));
  form.designations = tableValues(doc.designations, "designation").map(
    (designation) => ({
      designation,
    }),
  );
  return form;
}

/** Fields whose value differs between two forms; tables compare by their values. */
export function changedFields(
  saved: SystemSettingsForm,
  form: SystemSettingsForm,
): Partial<SystemSettingsForm> {
  const changes: Partial<SystemSettingsForm> = {};
  for (const field of SYSTEM_SETTINGS_FIELDS) {
    const before = saved[field] ?? null;
    const after = form[field] ?? null;
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      (changes as Record<string, unknown>)[field] = form[field] ?? null;
    }
  }
  return changes;
}
