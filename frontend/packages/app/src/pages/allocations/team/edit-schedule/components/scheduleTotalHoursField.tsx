/**
 * External dependencies.
 */
import { ErrorMessage, TextInput } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { ScheduleFieldGroupApi } from "../scheduleFieldGroup";
import type { EditScheduleDraft } from "../types";
import { getErrorMessage, toDisplayHours } from "../utils";

interface ScheduleTotalHoursFieldProps {
  group: ScheduleFieldGroupApi;
  scheduleDraft: EditScheduleDraft;
}

function ScheduleTotalHoursField({
  group,
  scheduleDraft,
}: ScheduleTotalHoursFieldProps) {
  return (
    <group.Field
      name="input.mode"
      children={(modeField) => (
        <group.Field
          name="input.value"
          children={(hoursField) => (
            <div className="flex-1 space-y-1.5">
              <label className="block text-base text-ink-gray-5">
                Edit Total Hours
              </label>
              <TextInput
                type="number"
                value={
                  scheduleDraft.hasSelection
                    ? toDisplayHours(scheduleDraft.totalHours)
                    : ""
                }
                disabled={!scheduleDraft.hasSelection}
                onChange={(event) => {
                  const parsedValue = Number(event.target.value);
                  modeField.handleChange("totalHours");
                  hoursField.handleChange(
                    Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0,
                  );
                }}
                variant="outline"
                size="md"
              />
              {modeField.state.value === "totalHours" &&
                !hoursField.state.meta.isValid && (
                  <ErrorMessage
                    message={getErrorMessage(hoursField.state.meta.errors[0])}
                  />
                )}
            </div>
          )}
        />
      )}
    />
  );
}

export default ScheduleTotalHoursField;
