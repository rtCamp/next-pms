/**
 * External dependencies.
 */
import { DurationInput } from "@next-pms/design-system/components";
import { ErrorMessage } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { ScheduleFieldGroupApi } from "../scheduleFieldGroup";
import type { EditScheduleDraft } from "../types";
import { getErrorMessage } from "../utils";

interface ScheduleHoursPerDayFieldProps {
  group: ScheduleFieldGroupApi;
  scheduleDraft: EditScheduleDraft;
}

function ScheduleHoursPerDayField({
  group,
  scheduleDraft,
}: ScheduleHoursPerDayFieldProps) {
  return (
    <group.Field
      name="input.mode"
      children={(modeField) => (
        <group.Field
          name="input.value"
          children={(hoursField) => (
            <div className="flex-1 space-y-1.5">
              <label className="block text-base text-ink-gray-5">
                Edit Hours / day
              </label>
              <DurationInput
                value={scheduleDraft.hoursPerDay}
                variant="compact"
                disabled={!scheduleDraft.hasSelection}
                onChange={(value) => {
                  modeField.handleChange("hoursPerDay");
                  hoursField.handleChange(value);
                }}
              />
              {modeField.state.value === "hoursPerDay" &&
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

export default ScheduleHoursPerDayField;
