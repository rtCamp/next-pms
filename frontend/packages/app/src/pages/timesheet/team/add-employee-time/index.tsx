/**
 * External Dependencies
 */
import { useCallback, useState } from "react";
import { DurationInput } from "@next-pms/design-system/components";
import {
  DatePicker,
  Dialog,
  Button,
  Textarea,
  ErrorMessage,
  Combobox,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm, useStore } from "@tanstack/react-form";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";
import { Calendar } from "lucide-react";

/**
 * Internal Dependencies
 */
import { useEmployeeLookup } from "@/hooks/useEmployeeLookup";
import { useProjectLookup } from "@/hooks/useProjectLookup";
import { useTaskLookup } from "@/hooks/useTaskLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { addTimeFormSchema } from "./schema";
import type { AddTeamTimeProps } from "./type";

const AddEmployeeTime = ({
  initialDate,
  open = false,
  onOpenChange,
  task = "",
  project = "",
  employeeId = "",
}: AddTeamTimeProps) => {
  const toast = useToasts();
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { call: saveTime } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.save",
  );

  const form = useForm({
    defaultValues: {
      employeeId: employeeId,
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
          employee: value.employeeId,
        });
        toast.success("Time Entry submitted successfully");
      } catch (err) {
        const error = parseFrappeErrorMsg(err as FrappeError);
        toast.error(error);
      } finally {
        setSubmitting(false);
        closeModal();
      }
    },
  });

  const closeModal = useCallback(() => {
    setEmployeeSearch("");
    setProjectSearch("");
    setTaskSearch("");
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

  const selectedProject = useStore(form.store, (state) => state.values.project);

  const { options: employeeOptions, isLoading: isEmployeeLookupLoading } =
    useEmployeeLookup({
      shouldFetch: open,
      pageSize: 20,
      query: employeeSearch,
    });

  const { options: projectOptions, isLoading: isProjectLookupLoading } =
    useProjectLookup({
      shouldFetch: open,
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
          name="employeeId"
          children={(field) => {
            return (
              <>
                <label className="block text-xs text-ink-gray-5 mb-1.5">
                  Employee
                </label>
                <Combobox
                  inputClassName="bg-white h-8 border-outline-gray-2"
                  loading={isEmployeeLookupLoading}
                  options={employeeOptions}
                  searchValue={employeeSearch}
                  placeholder="Select Employee"
                  value={field.state.value}
                  openOnFocus
                  onSearchChange={setEmployeeSearch}
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

        <form.Field
          name="comment"
          children={(field) => {
            return (
              <>
                <label className="block text-xs text-ink-gray-5">Comment</label>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="bg-white border-outline-gray-2"
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

export default AddEmployeeTime;
