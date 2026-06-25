/**
 * External dependencies
 */
import {
  Button,
  ErrorMessage,
  TextEditor,
  DurationInput,
} from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

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
  maxDurationInHours,
  submitting,
  editBaseline = null,
  onSave,
  onCommentKeyDown,
  children,
}: TimeEntryFormProps) => {
  return (
    <div className="flex flex-col w-full gap-2">
      <form.Field
        name="duration"
        children={(field) => {
          return (
            <div className="flex flex-col w-full gap-2">
              <DurationInput
                snap="smooth"
                hoursLeft={hoursLeft}
                label={durationLabel}
                inlineLabel="Duration"
                value={field.state.value}
                onChange={(val) => field.handleChange(val)}
                maxDuration={maxDurationInHours}
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          );
        }}
      />
      <form.Field
        name="comment"
        children={(field) => {
          return (
            <>
              <div
                className="relative w-full"
                onKeyDownCapture={(e) => onCommentKeyDown(e)}
              >
                <TextEditor
                  editable={!submitting}
                  content={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  fixedMenu={false}
                  placeholder="Comment"
                  editorClass="px-2 h-24 prose-sm overflow-scroll scrollbar-thin bg-white border rounded-md border-outline-gray-2 text-ink-gray-7 text-base leading-5.25"
                />
                {field.state.value === "" ? (
                  <span className="absolute text-sm align-middle right-2 bottom-1 text-ink-gray-4">
                    ⌘+↵
                  </span>
                ) : null}
              </div>
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
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
        children={({
          duration,
          comment,
          durationIsDefault,
          commentIsDefault,
        }) => {
          const isAddUnchanged = durationIsDefault && commentIsDefault;
          const isEditUnchanged =
            editBaseline !== null &&
            duration === editBaseline.duration &&
            comment === editBaseline.comment;
          const isSaveDisabled =
            submitting ||
            (mode === ENTRY_FORM_MODE.ADD ? isAddUnchanged : isEditUnchanged);

          return (
            <div className="flex justify-between w-full gap-2">
              <Button
                className="text-ink-gray-7"
                variant="subtle"
                size="sm"
                iconLeft={() => <AddSm size={16} />}
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
