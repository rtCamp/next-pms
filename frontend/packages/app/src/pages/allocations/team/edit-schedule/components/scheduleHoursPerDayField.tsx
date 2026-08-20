/**
 * External dependencies.
 */
import {
  DurationInput,
  ErrorMessage,
  FormLabel,
} from "@rtcamp/frappe-ui-react";

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
      <FormLabel size="md" required>
        Edit hours / day
      </FormLabel>
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
