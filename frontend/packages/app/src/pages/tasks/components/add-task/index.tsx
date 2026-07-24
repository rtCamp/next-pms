/**
 * External Dependencies
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Combobox,
  Dialog,
  ErrorMessage,
  Textarea,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal Dependencies
 */
import {
  useProjectLookup,
  type ProjectLookupOption,
} from "@/hooks/useProjectLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { addTaskFormSchema, type addTaskFormValues } from "./schema";
import type { AddTaskProps } from "./type";

const emptyValues: addTaskFormValues = {
  subject: "",
  project: "",
  projectLabel: "",
  expected_time: "",
  description: "",
};

const AddTask = ({
  open = false,
  onOpenChange,
  prefill,
  onSuccess,
}: AddTaskProps) => {
  const [projectSearch, setProjectSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toast = useToasts();
  const { call: createTask } = useFrappePostCall(
    "next_pms.timesheet.api.task.add_task",
  );

  const initialValues = useMemo<addTaskFormValues>(
    () => ({
      ...emptyValues,
      ...prefill,
    }),
    [prefill],
  );

  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: addTaskFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await createTask({
          subject: value.subject.trim(),
          project: value.project.trim(),
          expected_time: value.expected_time.trim(),
          description: value.description.trim(),
        });

        toast.success("Task created successfully");
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
        title: () => <span className="text-lg font-medium">Add Task</span>,
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
            label="Add Task"
            onClick={() => form.handleSubmit()}
            disabled={submitting}
            loading={submitting}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          <form.Field
            name="subject"
            children={(field) => (
              <div className="sm:col-span-9">
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
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />

          <form.Field
            name="expected_time"
            children={(field) => (
              <div className="sm:col-span-3">
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
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />
        </div>

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
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <div>
              <label className="block text-base text-ink-gray-5 mb-1.5">
                Description
              </label>
              <Textarea
                rows={4}
                placeholder="Add description"
                value={field.state.value}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  field.handleChange(event.target.value)
                }
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
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
