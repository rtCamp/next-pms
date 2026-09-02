/**
 * External dependencies.
 */
import { Checkbox, FormLabel, TextInput } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { TimesheetsPageProps } from "../types";

export function TimesheetsPage({
  autoExpandWeeks,
  useSystemAutoExpandWeeks,
  isLoading,
  onAutoExpandWeeksChange,
  onUseSystemAutoExpandWeeksChange,
}: TimesheetsPageProps) {
  return (
    <div className="max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-ink-gray-8">Timesheets</h2>
        <p className="mt-1 text-p-sm text-ink-gray-6">
          Configure your timesheet preferences.
        </p>
      </div>
      <div className="mt-10 max-w-sm">
        <FormLabel
          id="auto-expand-weeks"
          size="md"
          className="text-ink-gray-8!"
        >
          Default Expanded Weeks in Timesheet View
        </FormLabel>
        <TextInput
          htmlId="auto-expand-weeks"
          type="number"
          min="0"
          step="1"
          value={autoExpandWeeks}
          disabled={isLoading || useSystemAutoExpandWeeks}
          className="mt-2"
          onChange={(event) => onAutoExpandWeeksChange(event.target.value)}
        />
        <div className="mt-4">
          <Checkbox
            label="Use system default"
            value={useSystemAutoExpandWeeks}
            disabled={isLoading}
            onChange={onUseSystemAutoExpandWeeksChange}
          />
        </div>
        <p className="mt-2 text-p-sm text-ink-gray-6">
          Number of recent weeks expanded by default.
        </p>
      </div>
    </div>
  );
}
