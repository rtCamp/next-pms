/**
 * External Dependencies
 */
import { useState } from "react";
import { DurationInput } from "@next-pms/design-system/components";
import { ErrorMessage, Textarea, useToasts } from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";
import { Command, CornerDownLeft } from "lucide-react";

/**
 * Internal Dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { inlineTimeEntryValues } from "./schema";
import type { InlineTimeEntry as InlineTimeEntryProps } from "./types";

/**
 * InlineTimeEntry Component
 * @description This component is used to show inline time entry form in the popover when user clicks on
 * the cell in task row of timesheet table.User can enter the duration and comment for the time entry and 
 * submit the form to save the time entry for the task and date.
 * @param date - Date for which the time entry is being added.
 * @param task - Task name for the timesheet entry (eg: TASK-0001).
 * @param employee - Employee for the timesheet entry
 * @param dailyWorkingHours - Daily working hours for the task.
 */
export const InlineTimeEntry = ({ date, task, employee, dailyWorkingHours, onSubmitSuccess }: InlineTimeEntryProps) => {
  const toast = useToasts();
  const [submitting, setSubmitting] = useState(false);
  const { call: saveTime } = useFrappePostCall("next_pms.timesheet.api.timesheet.save");

  const form = useForm({
    defaultValues: {
      task: task,
      date: date,
      duration: 0,
      comment: "",
    },
    validators: {
      onSubmit: inlineTimeEntryValues,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);

      try {
        if (employee && date) {
          await saveTime({
            date: value.date,
            description: value.comment,
            task: value.task,
            hours: value.duration,
            employee,
          });
        }

        toast.success("Time Entry submitted successfully");
        onSubmitSuccess?.();
      } catch (err) {
        const error = parseFrappeErrorMsg(err as FrappeError);
        toast.error(error);
      } finally {
        setSubmitting(false);
        form.reset();
      }
    },
  });

  const handleSubmit = (e: React.KeyboardEvent<Element>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void form.handleSubmit();
    }
  };

  return (
    <div className="w-64 shadow bg-surface-modal rounded-lg flex flex-col gap-2 p-2">
      <form.Field
        name="duration"
        children={(field) => {
          return (
            <div className="w-full flex flex-col gap-2">
              <DurationInput
                variant="compact"
                value={field.state.value}
                onChange={(val) => field.handleChange(val)}
                maxDurationInHours={dailyWorkingHours}
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
              <div className="w-full relative" onKeyDownCapture={handleSubmit}>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="bg-white border-outline-gray-2"
                  placeholder="Comment"
                  disabled={submitting}
                />
                {field.state.value === "" ? (
                  <span className="absolute right-1 bottom-1 align-middle flex justify-center items-center text-ink-gray-4">
                    <Command size={16} />+<CornerDownLeft size={16} />
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
