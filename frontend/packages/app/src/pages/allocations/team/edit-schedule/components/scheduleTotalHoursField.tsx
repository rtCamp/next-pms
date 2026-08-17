/**
 * External dependencies.
 */
import { ErrorMessage, FormLabel, TextInput } from "@rtcamp/frappe-ui-react";

interface ScheduleTotalHoursFieldProps {
  value: string;
  disabled?: boolean;
  onChange: (value: number) => void;
  error?: string;
}

function ScheduleTotalHoursField({
  value,
  disabled,
  onChange,
  error,
}: ScheduleTotalHoursFieldProps) {
  return (
    <div className="flex-1 space-y-1.5">
      <FormLabel size="md" required>
        Edit total hours
      </FormLabel>
      <TextInput
        type="number"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const parsedValue = Number(event.target.value);
          onChange(Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0);
        }}
        variant="outline"
        size="sm"
      />
      {error ? <ErrorMessage message={error} /> : null}
    </div>
  );
}

export default ScheduleTotalHoursField;
