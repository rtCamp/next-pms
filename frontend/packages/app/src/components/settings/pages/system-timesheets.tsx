/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import {
  Checkbox,
  FormLabel,
  Password,
  TextInput,
} from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { usePMSSystemApiKey } from "@/hooks/usePMSSettings";
import {
  SettingsDaySelect,
  SettingsLinkField,
  SettingsMultiSelectField,
} from "../fields";
import type {
  FieldUpdater,
  SystemSettings,
  SystemTimesheetsPageProps,
} from "../types";

function ApiKeyField({
  hasApiKey,
  updateField,
}: {
  hasApiKey: boolean;
  updateField: FieldUpdater<SystemSettings>;
}) {
  const { value } = usePMSSystemApiKey(hasApiKey);
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const onChange = (next: string) => {
    setDraft(next);
    updateField("pm_report_api_key", next);
  };

  return (
    <div>
      <FormLabel size="md" className="text-ink-gray-8!">
        PM Report API Key
      </FormLabel>
      <div className="mt-2">
        <Password
          value={draft ?? ""}
          placeholder="Enter API key"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export function SystemTimesheetsPage({
  form,
  updateField,
  hasApiKey,
}: SystemTimesheetsPageProps) {
  const backdated = Boolean(form.allow_backdated_entries);
  const dailyReminder = Boolean(form.send_daily_reminder);
  const approvalReminder = Boolean(form.send_reminder_on_approval_request);
  const weeklyReminder = Boolean(form.send_weekly_approval_reminder);

  return (
    <div className="max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-ink-gray-8">Timesheets</h2>
        <p className="mt-1 text-p-sm text-ink-gray-6">
          Configure global timesheet defaults.
        </p>
      </div>

      <section className="mt-10">
        <h3 className="text-lg font-semibold text-ink-gray-8">
          Time Entry Rules
        </h3>
        <div className="mt-5 max-w-sm flex flex-col gap-5">
          <Checkbox
            label="Allow Backdated Entries"
            value={backdated}
            onChange={(value) =>
              updateField("allow_backdated_entries", value ? 1 : 0)
            }
          />
          {backdated && (
            <>
              <div>
                <FormLabel size="md" className="text-ink-gray-8!">
                  Allow Backdated Entries Till (Employee)
                </FormLabel>
                <TextInput
                  type="number"
                  min="0"
                  step="1"
                  value={String(
                    form.allow_backdated_entries_till_employee ?? "",
                  )}
                  className="mt-2"
                  onChange={(event) =>
                    updateField(
                      "allow_backdated_entries_till_employee",
                      Number(event.target.value),
                    )
                  }
                />
              </div>
              <div>
                <FormLabel size="md" className="text-ink-gray-8!">
                  Allow Backdated Entries Till (Manager)
                </FormLabel>
                <TextInput
                  type="number"
                  min="0"
                  step="1"
                  value={String(
                    form.allow_backdated_entries_till_manager ?? "",
                  )}
                  className="mt-2"
                  onChange={(event) =>
                    updateField(
                      "allow_backdated_entries_till_manager",
                      Number(event.target.value),
                    )
                  }
                />
              </div>
              <SettingsMultiSelectField
                label="Ignored Roles"
                doctype="Role"
                value={(form.ignored_role ?? [])
                  .map((row) => row.role)
                  .filter((value): value is string => Boolean(value))}
                onChange={(values) =>
                  updateField(
                    "ignored_role",
                    values.map((role) => ({ role })),
                  )
                }
              />
            </>
          )}
          <Checkbox
            label="Allow Future Entries"
            value={Boolean(form.allow_future_entries)}
            onChange={(value) =>
              updateField("allow_future_entries", value ? 1 : 0)
            }
          />
          <Checkbox
            label="Allow Weekend Entries"
            value={Boolean(form.allow_weekend_entries)}
            onChange={(value) =>
              updateField("allow_weekend_entries", value ? 1 : 0)
            }
          />
          <div>
            <FormLabel size="md" className="text-ink-gray-8!">
              Auto Expand Weeks by Default
            </FormLabel>
            <TextInput
              type="number"
              min="0"
              step="1"
              value={String(form.auto_expand_weeks_by_default ?? "")}
              className="mt-2"
              onChange={(event) =>
                updateField(
                  "auto_expand_weeks_by_default",
                  Number(event.target.value),
                )
              }
            />
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h3 className="text-lg font-semibold text-ink-gray-8">
          Reminder Settings
        </h3>
        <div className="mt-5 max-w-sm flex flex-col gap-5">
          <Checkbox
            label="Send Daily Reminder"
            value={dailyReminder}
            onChange={(value) =>
              updateField("send_daily_reminder", value ? 1 : 0)
            }
          />
          {dailyReminder && (
            <SettingsLinkField
              label="Daily Reminder Template"
              doctype="Email Template"
              value={form.daily_reminder_template}
              onChange={(value) =>
                updateField("daily_reminder_template", value)
              }
            />
          )}
          <Checkbox
            label="Send Reminder On Approval Request"
            value={approvalReminder}
            onChange={(value) =>
              updateField("send_reminder_on_approval_request", value ? 1 : 0)
            }
          />
          {approvalReminder && (
            <SettingsLinkField
              label="Approval Request Reminder Template"
              doctype="Email Template"
              value={form.approval_request_reminder_template}
              onChange={(value) =>
                updateField("approval_request_reminder_template", value)
              }
            />
          )}
          <SettingsLinkField
            label="Timesheet Approval Template"
            doctype="Email Template"
            value={form.timesheet_approval_template}
            clearable
            onChange={(value) =>
              updateField("timesheet_approval_template", value)
            }
          />
          <SettingsLinkField
            label="Timesheet Rejection Template"
            doctype="Email Template"
            value={form.timesheet_rejection_template}
            clearable
            onChange={(value) =>
              updateField("timesheet_rejection_template", value)
            }
          />
          <Checkbox
            label="Send Weekly Approval Reminder"
            value={weeklyReminder}
            onChange={(value) =>
              updateField("send_weekly_approval_reminder", value ? 1 : 0)
            }
          />
          {weeklyReminder && (
            <>
              <SettingsDaySelect
                label="Day To Send Weekly Reminder"
                value={form.day_to_send_reminder}
                onChange={(value) => updateField("day_to_send_reminder", value)}
              />
              <SettingsLinkField
                label="Weekly Approval Reminder Template"
                doctype="Email Template"
                value={form.weekly_approval_reminder_template}
                onChange={(value) =>
                  updateField("weekly_approval_reminder_template", value)
                }
              />
            </>
          )}
          {(dailyReminder || weeklyReminder) && (
            <SettingsMultiSelectField
              label="Allowed Departments"
              doctype="Department"
              value={(form.allowed_departments ?? [])
                .map((row) => row.department)
                .filter((value): value is string => Boolean(value))}
              onChange={(values) =>
                updateField(
                  "allowed_departments",
                  values.map((department) => ({ department })),
                )
              }
            />
          )}
        </div>
      </section>

      <section className="mt-10">
        <h3 className="text-lg font-semibold text-ink-gray-8">
          Report Configuration
        </h3>
        <div className="mt-5 max-w-sm">
          <ApiKeyField hasApiKey={hasApiKey} updateField={updateField} />
        </div>
      </section>
    </div>
  );
}
