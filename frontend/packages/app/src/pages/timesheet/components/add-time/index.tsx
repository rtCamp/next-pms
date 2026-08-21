/**
 * External Dependencies
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { TaskStatus, taskStatusMap } from "@next-pms/design-system/components";
import {
  DatePicker,
  Dialog,
  Button,
  ErrorMessage,
  Combobox,
  useToasts,
  TextEditor,
  DurationInput,
  FormLabel,
  type TextEditorHandle,
  type TextEditorProps,
} from "@rtcamp/frappe-ui-react";
import { Calendar, Folder } from "@rtcamp/frappe-ui-react/icons";
import { useForm } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal Dependencies
 */
import { datePickerFooter } from "@/components/datePickerFooter";
import {
  useProjectLookup,
  type ProjectLookupOption,
} from "@/hooks/useProjectLookup";
import { useTaskLookup, type TaskLookupOption } from "@/hooks/useTaskLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import CalendarEvents from "./calendarEvents";
import { addTimeFormSchema, type addTimeFormValues } from "./schema";
import type { AddTimeProps, SelectedCalendarEvent } from "./type";
import { useRemainingHours } from "../../hooks/useRemainingHours";

const COMMENT_EDITOR_STARTERKIT_OPTIONS: NonNullable<
  TextEditorProps["starterkitOptions"]
> = { trailingNode: false };

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
  taskLabel = "",
  project = "",
  projectLabel = "",
}: AddTimeProps) => {
  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));

  const toast = useToasts();
  const [projectSearch, setProjectSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [submittingAction, setSubmittingAction] = useState<
    "addAnother" | "close" | null
  >(null);
  const commentEditorRef = useRef<TextEditorHandle>(null);
  const prevSelectedEventIdsRef = useRef<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [entryKey, setEntryKey] = useState(0);
  const { call: saveTime } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.save",
  );

  const getDefaultValues = useCallback(
    (date: string): addTimeFormValues =>
      ({
        project: project,
        projectLabel: projectLabel || project || undefined,
        task: task,
        taskLabel: taskLabel || task || undefined,
        taskStatus: undefined,
        date: date,
        duration: 0,
        comment: "",
      }) satisfies addTimeFormValues,
    [project, projectLabel, task, taskLabel],
  );

  const form = useForm({
    defaultValues: getDefaultValues(initialDate),
    validators: {
      onSubmit: addTimeFormSchema,
    },
    onSubmitMeta: { keepOpen: false },
    onSubmit: async ({ value, meta }) => {
      setSubmittingAction(meta.keepOpen ? "addAnother" : "close");
      setSubmitError(null);
      try {
        await saveTime({
          date: value.date,
          description: value.comment,
          task: value.task,
          hours: value.duration,
          employee: employeeId,
        });
        toast.success("Time Entry submitted successfully");
        if (meta.keepOpen) {
          resetEntry(value.date);
          await refreshRemainingHours();
          return;
        }
        closeModal();
      } catch (err) {
        setSubmitError(parseFrappeErrorMsg(err as FrappeError));
      } finally {
        setSubmittingAction(null);
      }
    },
  });

  const resetEntry = useCallback(
    (date: string) => {
      setProjectSearch("");
      setTaskSearch("");
      setSubmitError(null);
      form.reset(getDefaultValues(date), { keepDefaultValues: true });
      prevSelectedEventIdsRef.current = new Set();
      setEntryKey((key) => key + 1);
    },
    [form, getDefaultValues],
  );

  const closeModal = useCallback(() => {
    setProjectSearch("");
    setTaskSearch("");
    setSubmitError(null);
    onOpenChange(false);
    form.reset();
  }, [form, onOpenChange]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        onOpenChange(true);
        return;
      }

      closeModal();
    },
    [closeModal, onOpenChange],
  );

  const selectedProject = useSelector(
    form.store,
    (state) => state.values.project,
  );
  const selectedProjectLabel = useSelector(
    form.store,
    (state) => state.values.projectLabel,
  );
  const selectedTask = useSelector(form.store, (state) => state.values.task);
  const selectedTaskLabel = useSelector(
    form.store,
    (state) => state.values.taskLabel,
  );
  const selectedTaskStatus = useSelector(
    form.store,
    (state) => state.values.taskStatus,
  );
  const selectedDate = useSelector(form.store, (state) => state.values.date);
  const selectedProjectOption: ProjectLookupOption | null = selectedProject
    ? {
        label: selectedProjectLabel || selectedProject,
        value: selectedProject,
      }
    : null;
  const selectedTaskOption: TaskLookupOption | null = selectedTask
    ? {
        label: selectedTaskLabel || selectedTask,
        value: selectedTask,
        projectId: selectedProject || project,
        projectName: selectedProjectLabel || projectLabel || project,
        status: selectedTaskStatus,
      }
    : null;

  const {
    maxDuration,
    hoursLeft,
    isLoading: isRemainingHoursLoading,
    refresh: refreshRemainingHours,
  } = useRemainingHours({
    employee: employeeId,
    date: selectedDate,
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getDefaultValues(initialDate));
    prevSelectedEventIdsRef.current = new Set();
  }, [form, getDefaultValues, initialDate, open]);

  const { options: projectOptions, isLoading: isProjectLookupLoading } =
    useProjectLookup({
      shouldFetch: open,
      filters: window.frappe?.boot?.global_filters.project,
      pageSize: 20,
      query: projectSearch,
      selectedOption: selectedProjectOption,
      formatOption: (option) => ({
        ...option,
        icon: <Folder className="size-4 shrink-0 text-ink-gray-7" />,
      }),
    });

  const { options: taskOptions, isLoading: isTaskLookupLoading } =
    useTaskLookup({
      shouldFetch: open,
      pageSize: 20,
      projectId: selectedProject || undefined,
      query: taskSearch,
      selectedOption: selectedTaskOption,
      formatOption: (option) => ({
        ...option,
        icon: (
          <TaskStatus status={taskStatusMap[option.status ?? ""] ?? "open"} />
        ),
      }),
    });

  const handleCalendarSelectionChange = useCallback(
    (selectedItems: SelectedCalendarEvent[], totalDurationHours: number) => {
      const nextIds = new Set(selectedItems.map((item) => item.id));
      const prevIds = prevSelectedEventIdsRef.current;

      selectedItems
        .filter((item) => !prevIds.has(item.id))
        .forEach((item) =>
          commentEditorRef.current?.addListItem(item.id, item.label),
        );

      [...prevIds]
        .filter((id) => !nextIds.has(id))
        .forEach((id) => commentEditorRef.current?.removeListItem(id));

      prevSelectedEventIdsRef.current = nextIds;
      form.setFieldValue("duration", totalDurationHours);
    },
    [form],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      className="my-0"
      classNames={{
        header: "mb-5",
        content: "pt-5 pb-2",
        viewport: "justify-start pt-30",
        footer: "pb-6",
      }}
      actions={
        <div className="flex items-center justify-between w-full gap-2">
          <Button
            className="w-full"
            variant="subtle"
            label="Save and add another"
            onClick={() => form.handleSubmit({ keepOpen: true })}
            disabled={submittingAction !== null}
            loading={submittingAction === "addAnother"}
          />
          <Button
            className="w-full"
            variant="solid"
            label="Save and close"
            onClick={() => form.handleSubmit()}
            disabled={submittingAction !== null}
            loading={submittingAction === "close"}
          />
        </div>
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
                <FormLabel size="md" className="mb-1.5" required>
                  Project
                </FormLabel>
                <Combobox
                  inputClassName="bg-surface-white h-8 border-outline-gray-2 text-ink-gray-7"
                  loading={isProjectLookupLoading}
                  options={projectOptions}
                  searchValue={projectSearch}
                  placeholder="Select project"
                  value={field.state.value}
                  openOnFocus
                  onSearchChange={setProjectSearch}
                  onChange={(val, option) => {
                    const nextProject = val ?? "";
                    const nextProjectOption =
                      option as ProjectLookupOption | null;
                    if (nextProject !== field.state.value) {
                      form.setFieldValue("task", "");
                      form.setFieldValue("taskLabel", "");
                      form.setFieldValue("taskStatus", "");
                      setTaskSearch("");
                    }
                    form.setFieldValue(
                      "projectLabel",
                      nextProjectOption?.label ?? nextProject,
                    );
                    field.handleChange(nextProject);
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
                <FormLabel size="md" className="mb-1.5" required>
                  Task
                </FormLabel>
                <Combobox
                  inputClassName="bg-surface-white h-8 border-outline-gray-2 text-ink-gray-7"
                  loading={isTaskLookupLoading}
                  options={taskOptions}
                  searchValue={taskSearch}
                  placeholder="Select task"
                  value={field.state.value}
                  openOnFocus
                  onSearchChange={setTaskSearch}
                  onChange={(val, option) => {
                    const nextTask = val ?? "";
                    field.handleChange(nextTask);
                    const nextTaskOption = option as TaskLookupOption | null;
                    form.setFieldValue(
                      "taskLabel",
                      nextTaskOption?.label ?? nextTask,
                    );
                    form.setFieldValue(
                      "taskStatus",
                      nextTaskOption?.status ?? "",
                    );
                    if (nextTaskOption?.projectId) {
                      form.setFieldValue("project", nextTaskOption.projectId);
                      form.setFieldValue(
                        "projectLabel",
                        nextTaskOption.projectName || nextTaskOption.projectId,
                      );
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
                <div className="flex-1">
                  <DatePicker
                    label="From"
                    onChange={(val) => field.handleChange(val as string)}
                    placeholder="Placeholder"
                    value={field.state.value}
                    footer={datePickerFooter}
                  >
                    {({ displayValue }) => {
                      return (
                        <div className="flex-1 flex w-full flex-col space-y-1.5 ">
                          <FormLabel size="md" required>
                            Date
                          </FormLabel>
                          <div
                            className={
                              "flex relative items-center rounded border border-outline-gray-2 px-2.5"
                            }
                          >
                            <input
                              type="text"
                              id="start"
                              value={displayValue}
                              className="h-7.5 flex-1 text-ink-gray-7 text-base"
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
                </div>
              );
            }}
          />
          <form.Field
            name="duration"
            children={(field) => {
              return (
                <div className="flex flex-col flex-1 w-full gap-2">
                  <DurationInput
                    label="Duration"
                    required
                    size="md"
                    snap="smooth"
                    maxDuration={maxDuration}
                    hoursLeft={hoursLeft}
                    loading={isRemainingHoursLoading}
                    disabled={isRemainingHoursLoading}
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
          key={`calendar-events-${entryKey}`}
          initialDate={selectedDate}
          enabled={open}
          onSelectionChange={handleCalendarSelectionChange}
        />

        <form.Field
          name="comment"
          children={(field) => {
            return (
              <>
                <FormLabel size="md" className="mb-1.5" required>
                  Comment
                </FormLabel>
                <TextEditor
                  key={`comment-${entryKey}`}
                  ref={commentEditorRef}
                  content={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  starterkitOptions={COMMENT_EDITOR_STARTERKIT_OPTIONS}
                  fixedMenu={false}
                  editorClass="px-2 h-24 prose-sm overflow-auto scrollbar-thin bg-surface-white border rounded-md border-outline-gray-2 text-ink-gray-7 text-base"
                />
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </>
            );
          }}
        />
        {submitError ? <ErrorMessage message={submitError} /> : null}
      </div>
    </Dialog>
  );
};

export default AddTime;
