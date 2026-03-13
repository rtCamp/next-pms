/**
 * External Dependencies
 */
import { useState } from "react";
import { floatToTime } from "@next-pms/design-system";
import { DurationInput } from "@next-pms/design-system/components";
import { Badge, Button, ErrorMessage, Textarea, useToasts } from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import { FrappeError, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Command, CornerDownLeft, Edit, Plus } from "lucide-react";

/**
 * Internal Dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { TaskDataItemProps } from "@/types/timesheet";
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
 * @param totalUsedHoursInDay - Total used hours in the day for the task.
 * @param onSubmitSuccess - Callback function to be called after successful submission of time entry.
 * @param isBillable - Whether the time entry is billable or not.
 */
export const InlineTimeEntry = ({
  date,
  task,
  employee,
  dailyWorkingHours = 8,
  totalUsedHoursInDay,
  onSubmitSuccess,
  isBillable = true,
}: InlineTimeEntryProps) => {
  const toast = useToasts();
  const [submitting, setSubmitting] = useState(false);
  const [addTime, setAddTime] = useState(false);
  const { call: saveTime } = useFrappePostCall("next_pms.timesheet.api.timesheet.save");
  const { call: updateTimesheet } = useFrappePostCall("next_pms.timesheet.api.timesheet.bulk_update_timesheet_detail");
  const { call: deleteTimesheet } = useFrappePostCall("next_pms.timesheet.api.timesheet.delete");
  const { data, isLoading, mutate } = useFrappeGetCall("next_pms.timesheet.api.timesheet.get_timesheet_details", {
    employee: employee,
    date: date,
    task: task,
  });

  const hoursLeft = (dailyWorkingHours ?? 0) - (totalUsedHoursInDay ?? 0);

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

  const handleSubmit = (e: React.KeyboardEvent<Element> | null = null) => {
    if (e === null) {
      void form.handleSubmit();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void form.handleSubmit();
    }
  };

  return (
    <div className="w-64 shadow bg-surface-modal rounded-lg flex flex-col gap-2 p-2">
      {data?.message?.data?.map((entry: TaskDataItemProps) => (
        <div
          className="group flex flex-col justify-start items-start gap-2 border-b border-outline-gray-modals pb-3"
          key={entry.name}
        >
          <div className="w-full flex justify-between items-center">
            <Badge
              prefix={
                !isBillable ? (
                  <div className="w-3 h-3 flex justify-center items-center">
                    <span className="block z-10 -bottom-0.5 left-1/2 w-1 h-1 rounded-full bg-surface-amber-3 transform -translate-x-1/2"></span>
                  </div>
                ) : null
              }
              variant="subtle"
              size="md"
              className="lining-nums tabular-nums text-ink-gray-9 gap-0"
            >
              {entry.hours ? floatToTime(entry.hours, 2) : "00:00"}
            </Badge>
            <Button
              className="w-5 h-5 hidden group-hover:inline-flex"
              variant="ghost"
              icon={() => <Edit className="text-ink-gray-7" size={16} />}
            />
          </div>
          <span className="text-base text-ink-gray-6">{entry.description}</span>
        </div>
      ))}

      <div className="w-full flex flex-col gap-2">
        {data?.message?.data?.length === 0 || addTime ? (
          <div className="w-full flex flex-col gap-2">
            <form.Field
              name="duration"
              children={(field) => {
                return (
                  <div className="w-full flex flex-col gap-2">
                    <DurationInput
                      hoursLeft={hoursLeft}
                      label="Add time"
                      variant={addTime ? "default" : "compact"}
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
                    <div className="w-full relative" onKeyDownCapture={(e) => (addTime ? undefined : handleSubmit(e))}>
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
        ) : null}
        <div className="w-full flex justify-start items-end">
          <Button
            variant="ghost"
            size="sm"
            iconLeft={() => <Plus className="text-ink-gray-7" size={16} />}
            onClick={() => (addTime ? handleSubmit() : setAddTime((prev) => !prev))}
          >
            {addTime ? "Save entry" : "Add time"}
          </Button>
        </div>
      </div>
    </div>
  );
};
