/**
 * External Dependencies
 */
import { useCallback, useEffect, useState } from "react";
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
import {
  FrappeError,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";
import { Calendar } from "lucide-react";

/**
 * Internal Dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import CalendarEvents from "./calendarEvents";
import { addTimeFormSchema } from "./schema";
import type { AddTimeProps, ProjectData, TaskItem } from "./type";

/**
 * Add Time Component
 * @description This component is used to show dialog to the user to add time
 * entry for the timesheet. User can select the  date, time, project, task and
 * and description for the timesheet entry.
 * @param initialDate - Initial date for the timesheet, this select the date in date picker.
 * @param open - Boolean value to open the dialog.
 * @param onOpenChange - Function to change the open state of the dialog.
 * @param task - Task name for the timesheet entry (eg: TASK-0001).
 * @param project - Project name for the timesheet entry (eg: Project-0001).
 */
const AddEmployeeTime = ({
  initialDate,
  open = false,
  onOpenChange,
  task = "",
  project = "",
}: AddTimeProps) => {
  const toast = useToasts();
  const [submitting, setSubmitting] = useState(false);
  const { call: saveTime } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.save",
  );

  const form = useForm({
    defaultValues: {
      employeeId: "",
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
        setSubmitting(false);
        toast.success("Time Entry submitted successfully");
      } catch (err) {
        const error = parseFrappeErrorMsg(err as FrappeError);
        toast.error(error);
      } finally {
        setSubmitting(false);
        onOpenChange(false);
        form.reset();
      }
    },
  });

  const selectedProject = useStore(form.store, (state) => state.values.project);
  const selectedDate = useStore(form.store, (state) => state.values.date);

  const { data: employeesData } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Employee",
    fields: ["name", "employee_name"],
    filters: window.frappe?.boot?.global_filters.employee,
    limit_page_length: "null",
  });

  const employeeOptions = (
    (employeesData?.message ?? []) as { name: string; employee_name: string }[]
  ).map((employee) => ({
    label: employee.employee_name,
    value: employee.name,
  }));

  const { data: projectsData } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    fields: ["name", "project_name"],
    filters: window.frappe?.boot?.global_filters.project,
    limit_page_length: "null",
  });

  const projectOptions = ((projectsData?.message ?? []) as ProjectData[]).map(
    (project) => ({
      label: project.project_name,
      value: project.name,
    }),
  );

  const { data: tasksData, mutate: mutateTasksData } = useFrappeGetCall(
    "next_pms.timesheet.api.task.get_task_list",
    {
      search: task,
      projects: selectedProject ? [selectedProject] : [],
      page_length: 100,
      filter_recent: true,
    },
  );

  useEffect(() => {
    mutateTasksData();
  }, [project, task, mutateTasksData]);

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

  const tasksOptions = ((tasksData?.message?.task ?? []) as TaskItem[]).map(
    (task) => ({
      label: task.subject,
      value: task.name,
      projectName: task.project,
    }),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
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
                  options={employeeOptions}
                  placeholder="Select Employee"
                  value={field.state.value}
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
                  options={projectOptions}
                  placeholder="Select Project"
                  value={field.state.value}
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
                  options={tasksOptions}
                  placeholder="Select Task"
                  value={field.state.value}
                  onChange={(val) => {
                    field.handleChange(val as string);
                    const selectedTask = tasksOptions.find(
                      (task) => task.value === val,
                    );
                    if (selectedTask?.projectName) {
                      form.setFieldValue("project", selectedTask.projectName);
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
