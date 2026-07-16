/**
 * External Dependencies
 */
import { useCallback, useEffect, useState } from "react";
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
} from "@rtcamp/frappe-ui-react";
import { Calendar, Folder } from "@rtcamp/frappe-ui-react/icons";
import { useForm } from "@tanstack/react-form";
import { useSelector } from "@tanstack/react-store";
import {
  FrappeError,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal Dependencies
 */
import { useEmployeeLookup } from "@/hooks/useEmployeeLookup";
import {
  useProjectLookup,
  type ProjectLookupOption,
} from "@/hooks/useProjectLookup";
import { useTaskLookup, type TaskLookupOption } from "@/hooks/useTaskLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { addTimeFormSchema, type addTimeFormValues } from "./schema";
import type { AddTeamTimeProps } from "./type";
import { FALLBACK_DAILY_WORKING_HOURS } from "../../constants";

const AddEmployeeTime = ({
  initialDate,
  open = false,
  onOpenChange,
  task = "",
  taskLabel = "",
  project = "",
  projectLabel = "",
  employeeId = "",
  employeeLabel = "",
}: AddTeamTimeProps) => {
  const toast = useToasts();
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { call: saveTime } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.save",
  );

  const form = useForm({
    defaultValues: {
      employeeId: employeeId,
      project: project,
      projectLabel: projectLabel || project || undefined,
      task: task,
      taskLabel: taskLabel || task || undefined,
      taskStatus: undefined,
      date: initialDate,
      duration: 0,
      comment: "",
    } as addTimeFormValues,
    validators: {
      onSubmit: addTimeFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await saveTime({
          date: value.date,
          description: value.comment,
          task: value.task,
          hours: value.duration,
          employee: value.employeeId,
        });
        toast.success("Time Entry submitted successfully");
        closeModal();
      } catch (err) {
        setSubmitError(parseFrappeErrorMsg(err as FrappeError));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const closeModal = useCallback(() => {
    setEmployeeSearch("");
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
  const selectedEmployeeId = useSelector(
    form.store,
    (state) => state.values.employeeId,
  );
  const selectedProjectOption: ProjectLookupOption | null = selectedProject
    ? {
        label: selectedProjectLabel || selectedProject,
        value: selectedProject,
      }
    : null;
  const selectedEmployeeOption = employeeId
    ? {
        label: employeeLabel || employeeId,
        value: employeeId,
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

  const { data: remainingHours, isLoading: isRemainingHoursLoading } =
    useFrappeGetCall(
      "next_pms.timesheet.api.timesheet.get_remaining_hour_for_employee",
      { employee: selectedEmployeeId, date: selectedDate },
      open && selectedEmployeeId && selectedDate ? undefined : null,
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      employeeId,
      project,
      projectLabel: projectLabel || project || undefined,
      task,
      taskLabel: taskLabel || task || undefined,
      taskStatus: undefined,
      date: initialDate,
      duration: 0,
      comment: "",
    });
  }, [
    employeeId,
    form,
    initialDate,
    open,
    project,
    projectLabel,
    task,
    taskLabel,
  ]);

  const { options: employeeOptions, isLoading: isEmployeeLookupLoading } =
    useEmployeeLookup({
      shouldFetch: open,
      pageSize: 20,
      query: employeeSearch,
      selectedOption: selectedEmployeeOption,
    });

  const { options: projectOptions, isLoading: isProjectLookupLoading } =
    useProjectLookup({
      shouldFetch: open,
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
                <label className="block text-base text-ink-gray-5 mb-1.5">
                  Employee
                </label>
                <Combobox
                  inputClassName="bg-surface-white h-8 border-outline-gray-2 text-ink-gray-7"
                  loading={isEmployeeLookupLoading}
                  options={employeeOptions}
                  searchValue={employeeSearch}
                  placeholder="Select employee"
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
                <label className="block text-base text-ink-gray-5 mb-1.5">
                  Project
                </label>
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
                <label className="block text-base text-ink-gray-5 mb-1.5">
                  Task
                </label>
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
                  >
                    {({ displayValue }) => {
                      return (
                        <div className="flex-1 flex w-full flex-col space-y-1.5 ">
                          <label className="block text-base text-ink-gray-5">
                            Date
                          </label>
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
                    size="md"
                    snap="smooth"
                    maxDuration={
                      remainingHours?.message?.working_hour ??
                      FALLBACK_DAILY_WORKING_HOURS
                    }
                    hoursLeft={
                      remainingHours?.message?.remaining_hours ??
                      FALLBACK_DAILY_WORKING_HOURS
                    }
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

        <form.Field
          name="comment"
          children={(field) => {
            return (
              <>
                <label className="block text-base text-ink-gray-5 mb-1.5">
                  Comment
                </label>
                <TextEditor
                  content={field.state.value}
                  onChange={(value) => field.handleChange(value)}
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

export default AddEmployeeTime;
