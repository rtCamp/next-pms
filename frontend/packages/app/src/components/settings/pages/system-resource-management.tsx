/**
 * External dependencies.
 */
import { Checkbox } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import {
  SettingsCurrencyField,
  SettingsDaySelect,
  SettingsLinkField,
  SettingsMultiSelectField,
} from "../fields";
import type { SystemResourceManagementPageProps } from "../types";

export function SystemResourceManagementPage({
  form,
  updateField,
}: SystemResourceManagementPageProps) {
  const sendReminder = Boolean(form.send_missing_allocation_reminder);

  return (
    <div className="max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-ink-gray-8">
          Resource Management
        </h2>
        <p className="mt-1 text-p-sm text-ink-gray-6">
          Configure global resource management settings.
        </p>
      </div>

      <section className="mt-10">
        <h3 className="text-lg font-semibold text-ink-gray-8">Rate Display</h3>
        <div className="mt-5 max-w-sm">
          <SettingsCurrencyField
            value={form.default_currency}
            onChange={(value) => updateField("default_currency", value)}
          />
        </div>
      </section>

      <section className="mt-10">
        <h3 className="text-lg font-semibold text-ink-gray-8">
          Allocation Notifications
        </h3>
        <div className="mt-5 max-w-sm flex flex-col gap-5">
          <Checkbox
            label="Send Missing Allocation Reminder"
            value={sendReminder}
            onChange={(value) =>
              updateField("send_missing_allocation_reminder", value ? 1 : 0)
            }
          />
          {sendReminder && (
            <>
              <SettingsDaySelect
                label="Remind On"
                value={form.remind_on}
                onChange={(value) => updateField("remind_on", value)}
              />
              <SettingsLinkField
                label="Email Template"
                doctype="Email Template"
                value={form.allocation_email_template}
                onChange={(value) =>
                  updateField("allocation_email_template", value)
                }
              />
              <SettingsMultiSelectField
                label="Designations"
                doctype="Designation"
                value={(form.designations ?? [])
                  .map((row) => row.designation)
                  .filter((value): value is string => Boolean(value))}
                onChange={(values) =>
                  updateField(
                    "designations",
                    values.map((designation) => ({ designation })),
                  )
                }
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
