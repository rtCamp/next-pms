/**
 * External dependencies.
 */
import { DurationInput, ErrorMessage } from "@rtcamp/frappe-ui-react";

interface ScheduleHoursPerDayFieldProps {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  error?: string;
}

function ScheduleHoursPerDayField({
  value,
  disabled,
  onChange,
  error,
}: ScheduleHoursPerDayFieldProps) {
  return (
    <div className="flex-1 space-y-1.5">
      <label className="block text-base text-ink-gray-5">
        Edit Hours / day
      </label>
      <DurationInput
        snap="smooth"
        variant="outline"
        value={value}
        disabled={disabled}
        onChange={onChange}
        className="shrink-0"
      />
      {error ? <ErrorMessage message={error} /> : null}
    </div>
  );
}

export default ScheduleHoursPerDayField;
