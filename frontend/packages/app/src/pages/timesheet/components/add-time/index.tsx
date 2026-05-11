/**
 * External Dependencies
 */
import { useCallback, useState } from "react";
import { DurationInput } from "@next-pms/design-system/components";
import {
  DatePicker,
  Dialog,
  Button,
  ErrorMessage,
  Combobox,
  useToasts,
  TextEditor,
} from "@rtcamp/frappe-ui-react";
import { useForm, useStore } from "@tanstack/react-form";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";
import { Calendar } from "lucide-react";

/**
 * Internal Dependencies
 */
import { useProjectLookup } from "@/hooks/useProjectLookup";
import { useTaskLookup } from "@/hooks/useTaskLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import CalendarEvents from "./calendarEvents";
import { addTimeFormSchema } from "./schema";
import type { AddTimeProps } from "./type";

/**
 * Add Time Component
 * @description This component is used to show dialog to the user to add time
 * entry for the timesheet. User can select the date, time, project, task and
 * description for the timesheet entry.
 * @param initialDate - Initial date for the timesheet, this select the date in date picker.
 * @param employee - Employee for the timesheet entry(In case of employee role they can select their employee only).
 * @param open - Boolean value to open the dialog.
 * @param onOpenChange - Function to change the open state of the dialog.
 * @param task - Task name for the timesheet entry (eg: TASK-0001).
 * @param project - Project name for the timesheet entry (eg: Project-0001).
 */
const AddTime = ({
  initialDate,
  open = false,
  onOpenChange,
  task = "",
  project = "",
}: AddTimeProps) => {
  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const toast = useToasts();
  const [projectSearch, setProjectSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { call: saveTime } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.save",
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setProjectSearch("");
        setTaskSearch("");
      }

      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const form = useForm({
    defaultValues: {
      project: project,
      task: task,
      date: initialDate,
      duration: 0,
      comment: "",
    },
    validators: {
      onSubmit: addTimeFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        await saveTime({
          date: value.date,
          description: value.comment,
          task: value.task,
          hours: value.duration,
          employee: employeeId,
        });
        toast.success("Time Entry submitted successfully");
      } catch (err) {
        const error = parseFrappeErrorMsg(err as FrappeError);
        toast.error(error);
      } finally {
        setSubmitting(false);
        handleOpenChange(false);
        form.reset();
      }
    },
  });

  const selectedProject = useStore(form.store, (state) => state.values.project);
  const selectedDate = useStore(form.store, (state) => state.values.date);

  const { options: projectOptions, isLoading: isProjectLookupLoading } =
    useProjectLookup({
      shouldFetch: open,
      extraFilters: window.frappe?.boot?.global_filters.project,
      pageSize: 20,
      query: projectSearch,
    });

  const { options: taskOptions, isLoading: isTaskLookupLoading } =
    useTaskLookup({
      shouldFetch: open,
      pageSize: 20,
      projectId: selectedProject || undefined,
      query: taskSearch,
    });

  const handleCalendarSelectionChange = useCallback(
    (selectedLabels: string[], allEventSubjects: string[]) => {
      const currentComment = form.state.values.comment || "";
      const preservedLines = currentComment
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) =>
            line &&
            !allEventSubjects.some(
              (subject) =>
                line === subject ||
                line === `- ${subject}` ||
                line.startsWith(`- ${subject} | `),
            ),
        );

      const selectedSubjectLines = selectedLabels.map((label) => `- ${label}`);

      form.setFieldValue(
        "comment",
        [...preservedLines, ...selectedSubjectLines].join("\n"),
      );
    },
    [form],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      actions={
        <Button
          className="w-full"
          variant="solid"
          label="Save entry"
          onClick={() => form.handleSubmit()}
          disabled={submitting}
          loading={submitting}
        />
      }
      options={{
        title: "Add time",
      }}
    >
      <div className="space-y-4">
        <form.Field
          name="project"
          children={(field) => {
            return (
              <>
                <label className="block text-xs text-ink-gray-5 mb-1.5">
                  Project
                </label>
                <Combobox
                  inputClassName="bg-white h-8 border-outline-gray-2"
                  loading={isProjectLookupLoading}
                  options={projectOptions}
                  searchValue={projectSearch}
                  placeholder="Select Project"
                  value={field.state.value}
                  openOnFocus
                  onSearchChange={setProjectSearch}
                  onChange={(val) => {
                    field.handleChange(val as string);
                  }}
                />
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </>
            );
          }}
        />
        <form.Field
          name="task"
          children={(field) => {
            return (
              <>
                <label className="block text-xs text-ink-gray-5 mb-1.5">
                  Task
                </label>
                <Combobox
                  inputClassName="bg-white h-8 border-outline-gray-2"
                  loading={isTaskLookupLoading}
                  options={taskOptions}
                  searchValue={taskSearch}
                  placeholder="Select Task"
                  value={field.state.value}
                  openOnFocus
                  onSearchChange={setTaskSearch}
                  onChange={(val) => {
                    field.handleChange(val as string);
                    const selectedTask = taskOptions.find(
                      (task) => task.value === val,
                    );
                    if (selectedTask?.projectId) {
                      form.setFieldValue("project", selectedTask.projectId);
                    }
                  }}
                />
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </>
            );
          }}
        />
        <div className="flex gap-4">
          <form.Field
            name="date"
            children={(field) => {
              return (
                <>
                  <DatePicker
                    label="From"
                    onChange={(val) => field.handleChange(val as string)}
                    placeholder="Placeholder"
                    value={field.state.value}
                  >
                    {({ displayValue }) => {
                      return (
                        <div className=" flex-1 flex w-full flex-col space-y-1.5 ">
                          <label className="block text-xs text-ink-gray-5">
                            Date
                          </label>
                          <div
                            className={
                              "flex relative items-center py-1 rounded-lg border border-outline-gray-2 px-2.5"
                            }
                          >
                            <input
                              type="text"
                              id="start"
                              value={displayValue}
                              className={`flex-1`}
                              placeholder="Today"
                            />
                            <Calendar className="size-4" />
                          </div>
                        </div>
                      );
                    }}
                  </DatePicker>
                  {!field.state.meta.isValid && (
                    <ErrorMessage
                      message={field.state.meta.errors[0]?.message}
                    />
                  )}
                </>
              );
            }}
          />
          <form.Field
            name="duration"
            children={(field) => {
              return (
                <div className="flex flex-col gap-2 w-full">
                  <DurationInput
                    value={field.state.value}
                    onChange={(val) => field.handleChange(val)}
                  />
                  {!field.state.meta.isValid && (
                    <ErrorMessage
                      message={field.state.meta.errors[0]?.message}
                    />
                  )}
                </div>
              );
            }}
          />
        </div>

        <CalendarEvents
          initialDate={selectedDate}
          enabled={open}
          onSelectionChange={handleCalendarSelectionChange}
        />

        <form.Field
          name="comment"
          children={(field) => {
            return (
              <>
                <label className="block text-xs text-ink-gray-5">Comment</label>
                <TextEditor
                  content={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  fixedMenu={false}
                  editorClass="px-2 h-24 overflow-auto scrollbar bg-white border rounded-md border-outline-gray-2"
                />
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </>
            );
          }}
        />
      </div>
    </Dialog>
  );
};

export default AddTime;
