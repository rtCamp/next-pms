/**
 * External dependencies
 */
import { DurationInput } from "@next-pms/design-system/components";
import { Button, ErrorMessage, Textarea } from "@rtcamp/frappe-ui-react";
import { Command, CornerDownLeft, Plus } from "lucide-react";

/**
 * Internal dependencies
 */
import { ENTRY_FORM_MODE } from ".";
import { TimeEntryFormProps } from "./types";

/**
 * TimeEntryForm Component
 * Renders a form for entering time entry details, including duration and comments.
 * @param form An instance of the form API to manage form state and actions.
 * @param mode A string indicating whether the form is in "add" or "edit" mode.
 * @param hoursLeft The number of hours left that can be logged for the day.
 * @param durationLabel The label to display for the duration input field.
 * @param durationVariant The variant style to apply to the duration input field.
 * @param maxDurationInHours The maximum number of hours that can be entered in the duration field.
 * @param submitting A boolean indicating whether the form is currently being submitted, used to disable inputs during submission.
 * @param editBaseline An optional object containing the original duration and comment values when in edit mode.
 * @param onCommentKeyDown A callback function to handle key down events in the comment textarea.
 */
export const TimeEntryForm = ({
  form,
  mode,
  hoursLeft,
  durationLabel,
  durationVariant,
  maxDurationInHours,
  submitting,
  editBaseline = null,
  onSave,
  onCommentKeyDown,
  children,
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
      <form.Subscribe
        selector={(state) => ({
          duration: state.values.duration,
          comment: state.values.comment,
          durationIsDefault: state.fieldMeta.duration?.isDefaultValue ?? true,
          commentIsDefault: state.fieldMeta.comment?.isDefaultValue ?? true,
        })}
        children={({ duration, comment, durationIsDefault, commentIsDefault }) => {
          const isAddUnchanged = durationIsDefault && commentIsDefault;
          const isEditUnchanged =
            editBaseline !== null && duration === editBaseline.duration && comment === editBaseline.comment;
          const isSaveDisabled = submitting || (mode === ENTRY_FORM_MODE.ADD ? isAddUnchanged : isEditUnchanged);

          return (
            <div className="w-full flex justify-between gap-2">
              <Button
                variant="subtle"
                size="sm"
                iconLeft={() => <Plus size={16} />}
                onClick={onSave}
                disabled={isSaveDisabled}
              >
                Save entry
              </Button>
              {children}
            </div>
          );
        }}
      />
    </div>
  );
};
