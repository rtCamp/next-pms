/**
 * External Dependencies
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Combobox,
  DatePicker,
  Dialog,
  ErrorMessage,
  Select,
  TextEditor,
  TextInput,
  useToasts,
  type TextEditorProps,
} from "@rtcamp/frappe-ui-react";
import { Calendar } from "@rtcamp/frappe-ui-react/icons";
import { useForm } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { useFrappePostCall, useFrappeUpdateDoc } from "frappe-react-sdk";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal Dependencies
 */
import {
  useProjectLookup,
  type ProjectLookupOption,
} from "@/hooks/useProjectLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import {
  addTaskFormSchema,
  editTaskFormSchema,
  type AddTaskFormValues,
} from "./schema";
import type { AddTaskProps } from "./type";
import { TASK_PRIORITY_OPTIONS } from "../../constants";

const DESCRIPTION_EDITOR_STARTERKIT_OPTIONS: NonNullable<
  TextEditorProps["starterkitOptions"]
> = { trailingNode: false };

const emptyValues: AddTaskFormValues = {
  subject: "",
  project: "",
  projectLabel: "",
  expected_time: "",
  priority: "Low",
  exp_end_date: "",
  description: "",
};

const AddTask = ({
  open = false,
  onOpenChange,
  prefill,
  taskName,
  onSuccess,
}: AddTaskProps) => {
  const [projectSearch, setProjectSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toast = useToasts();
  const { call: createTask } = useFrappePostCall(
    "next_pms.timesheet.api.task.add_task",
  );
  const { updateDoc } = useFrappeUpdateDoc();
  const isEditMode = Boolean(taskName);

  const initialValues = useMemo<AddTaskFormValues>(
    () => ({
      ...emptyValues,
      ...prefill,
    }),
    [prefill],
  );

  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: isEditMode ? editTaskFormSchema : addTaskFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        if (isEditMode && taskName) {
          await updateDoc("Task", taskName, {
            subject: value.subject.trim(),
            project: value.project.trim(),
            expected_time: value.expected_time.trim(),
            priority: value.priority?.trim() || "",
            exp_end_date: value.exp_end_date?.trim() || "",
            description: value.description.trim(),
          });
        } else {
          await createTask({
            subject: value.subject.trim(),
            project: value.project.trim(),
            expected_time: value.expected_time.trim(),
            priority: value.priority?.trim() || "",
            exp_end_date: value.exp_end_date?.trim() || "",
            description: value.description.trim(),
          });
        }

        toast.success(
          isEditMode
            ? "Task updated successfully"
            : "Task created successfully",
        );
        closeModal();
        onSuccess?.();
      } catch (err) {
        const error = parseFrappeErrorMsg(err as FrappeError);
        setSubmitError(error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(initialValues);
    }
  }, [form, open, initialValues]);

  const selectedProject = useSelector(
    form.store,
    (state) => state.values.project,
  );

  const selectedProjectLabel = useSelector(
    form.store,
    (state) => state.values.projectLabel,
  );

  const selectedProjectOption: ProjectLookupOption | null = selectedProject
    ? {
        label: selectedProjectLabel || selectedProject,
        value: selectedProject,
      }
    : null;

  const { options: projectOptions, isLoading: isProjectLookupLoading } =
    useProjectLookup({
      shouldFetch: open,
      filters: window.frappe?.boot?.global_filters.project,
      pageSize: 20,
      query: projectSearch,
      selectedOption: selectedProjectOption,
    });

  const closeModal = useCallback(() => {
    if (submitting) {
      return;
    }
    setProjectSearch("");
    setSubmitError(null);
    onOpenChange(false);
    form.reset(emptyValues);
  }, [form, onOpenChange, submitting]);

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

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      options={{
        title: () => (
          <span className="text-lg font-medium">
            {isEditMode ? "Edit Task" : "Add Task"}
          </span>
        ),
      }}
      className="my-0"
      classNames={{
        header: "mb-5",
        content: "pt-5 pb-2",
        viewport: "justify-start pt-30",
        footer: "pb-6",
      }}
      actions={
        <div className="flex items-center justify-end w-full gap-2">
          <Button variant="ghost" label="Cancel" onClick={closeModal} />
          <Button
            variant="solid"
            label={isEditMode ? "Save" : "Add Task"}
            onClick={() => form.handleSubmit()}
            disabled={submitting}
            loading={submitting}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <form.Field
          name="project"
          children={(field) => (
            <div>
              <label className="block text-base text-ink-gray-5 mb-1.5">
                Project
              </label>
              <Combobox
                inputClassName="bg-surface-white h-8 border-outline-gray-2 text-ink-gray-7"
                loading={isProjectLookupLoading}
                options={projectOptions}
                placeholder="Select project"
                searchValue={projectSearch}
                onSearchChange={setProjectSearch}
                value={field.state.value}
                onChange={(value, option) => {
                  const nextProject = value ?? "";
                  const nextProjectOption =
                    option as ProjectLookupOption | null;
                  form.setFieldValue(
                    "projectLabel",
                    nextProjectOption?.label ?? nextProject,
                  );
                  field.handleChange(nextProject);
                }}
                openOnFocus
              />
              {!field.state.meta.isValid && (
                <div className="mt-4">
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                </div>
              )}
            </div>
          )}
        />

        <form.Field
          name="subject"
          children={(field) => (
            <div>
              <label className="block text-base text-ink-gray-5 mb-1.5">
                Subject
              </label>
              <TextInput
                size="md"
                variant="outline"
                placeholder="Add subject"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {!field.state.meta.isValid && (
                <div className="mt-4">
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                </div>
              )}
            </div>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <form.Field
            name="priority"
            children={(field) => (
              <div>
                <label className="block text-base text-ink-gray-5 mb-1.5">
                  Priority
                </label>
                <Select
                  size="md"
                  variant="outline"
                  placeholder="Priority"
                  options={TASK_PRIORITY_OPTIONS}
                  value={field.state.value}
                  onChange={(value) =>
                    field.handleChange(
                      (value ?? "") as AddTaskFormValues["priority"],
                    )
                  }
                />
                {!field.state.meta.isValid && (
                  <div className="mt-4">
                    <ErrorMessage
                      message={field.state.meta.errors[0]?.message}
                    />
                  </div>
                )}
              </div>
            )}
          />

          <form.Field
            name="expected_time"
            children={(field) => (
              <div>
                <label className="block text-base text-ink-gray-5 mb-1.5">
                  Expected Time
                </label>
                <TextInput
                  size="md"
                  variant="outline"
                  placeholder="Hours"
                  type="number"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {!field.state.meta.isValid && (
                  <div className="mt-4">
                    <ErrorMessage
                      message={field.state.meta.errors[0]?.message}
                    />
                  </div>
                )}
              </div>
            )}
          />

          <form.Field
            name="exp_end_date"
            children={(field) => (
              <div>
                <label className="block text-base text-ink-gray-5 mb-1.5">
                  Due Date
                </label>
                <DatePicker
                  variant="outline"
                  placeholder="Due Date"
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value as string)}
                >
                  {({ displayValue, onTriggerKeyDown }) => (
                    <div className="flex h-8 items-center gap-2 rounded border border-outline-gray-2 bg-surface-white px-2.5">
                      <input
                        type="text"
                        value={displayValue}
                        readOnly
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onKeyDown={onTriggerKeyDown}
                        placeholder="Due Date"
                        className="min-w-0 flex-1 text-base text-ink-gray-7"
                      />
                      <Calendar className="size-4 shrink-0" />
                    </div>
                  )}
                </DatePicker>
                {!field.state.meta.isValid && (
                  <div className="mt-4">
                    <ErrorMessage
                      message={field.state.meta.errors[0]?.message}
                    />
                  </div>
                )}
              </div>
            )}
          />
        </div>

        <form.Field
          name="description"
          children={(field) => (
            <div>
              <label className="block text-base text-ink-gray-5 mb-1.5">
                Description
              </label>
              <TextEditor
                placeholder="Add description"
                content={field.state.value}
                onChange={(value) => field.handleChange(value)}
                starterkitOptions={DESCRIPTION_EDITOR_STARTERKIT_OPTIONS}
                fixedMenu={false}
                editorClass="px-2 h-24 prose-sm overflow-auto scrollbar-thin bg-surface-white border rounded-md border-outline-gray-2 text-ink-gray-7 text-base"
              />
              {!field.state.meta.isValid && (
                <div className="mt-4">
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                </div>
              )}
            </div>
          )}
        />

        {submitError && <ErrorMessage message={submitError} />}
      </div>
    </Dialog>
  );
};

export default AddTask;
