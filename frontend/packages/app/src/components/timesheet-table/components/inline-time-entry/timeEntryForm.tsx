/**
 * External dependencies
 */
import { DurationInput } from "@next-pms/design-system/components";
import { ErrorMessage, Textarea } from "@rtcamp/frappe-ui-react";
import { Command, CornerDownLeft } from "lucide-react";

/**
 * Internal dependencies
 */
import { TimeEntryFormProps } from "./types";

/**
 * TimeEntryForm Component
 * Renders a form for entering time entry details, including duration and comments.
 * @param form An instance of the form API to manage form state and actions.
 * @param hoursLeft The number of hours left that can be logged for the day.
 * @param durationLabel The label to display for the duration input field.
 * @param durationVariant The variant style to apply to the duration input field.
 * @param maxDurationInHours The maximum number of hours that can be entered in the duration field.
 * @param submitting A boolean indicating whether the form is currently being submitted, used to disable inputs during submission.
 * @param onCommentKeyDown A callback function to handle key down events in the comment textarea.
 */
export const TimeEntryForm = ({
  form,
  hoursLeft,
  durationLabel,
  durationVariant,
  maxDurationInHours,
  submitting,
  onCommentKeyDown,
}: TimeEntryFormProps) => {
  return (
    <div className="w-full flex flex-col gap-2">
      <form.Field
        name="duration"
        children={(field) => {
          return (
            <div className="w-full flex flex-col gap-2">
              <DurationInput
                hoursLeft={hoursLeft}
                label={durationLabel}
                variant={durationVariant}
                value={field.state.value}
                onChange={(val) => field.handleChange(val)}
                maxDurationInHours={maxDurationInHours}
              />
              {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
            </div>
          );
        }}
      />
      <form.Field
        name="comment"
        children={(field) => {
          return (
            <>
              <div className="w-full relative" onKeyDownCapture={(e) => onCommentKeyDown(e)}>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="bg-white border-outline-gray-2"
                  placeholder="Comment"
                  disabled={submitting}
                />
                {field.state.value === "" ? (
                  <span className="absolute text-xs right-1 bottom-1 align-middle flex justify-center items-center text-ink-gray-4">
                    <Command className="w-3.5! h-3.5!" />+<CornerDownLeft className="w-3.5! h-3.5!" />
                  </span>
                ) : null}
              </div>
              {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
            </>
          );
        }}
      />
    </div>
  );
};
