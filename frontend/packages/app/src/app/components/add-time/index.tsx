/**
 * External Dependencies
 */
import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    DurationInput,
  useToast,
} from "@next-pms/design-system/components";
import {
  DatePicker,
  Dialog,
  Button,
  Select,
  Textarea,
  ErrorMessage,
  Combobox
} from "@rtcamp/frappe-ui-react";
import { getFormatedDate } from "@next-pms/design-system/date";
import { FrappeConfig, FrappeContext, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Calendar } from "lucide-react";
import { z } from "zod";

/**
 * Internal Dependencies
 */
import { expectatedHours, parseFrappeErrorMsg } from "@/lib/utils";
import { TimesheetSchema } from "@/schema/timesheet";
import type { AddTimeProps, ProjectData, TaskItem } from "./type";
import { addTimeFormSchema } from "./schema";

/**
 * Add Time Component
 * @description This component is used to show dialog to the user to add time
 * entry for the timesheet. User can select the  date, time, project, task and
 * and description for the timesheet entry.
 * @param initialDate - Initial date for the timesheet, this select the date in date picker.
 * @param employee - Employee for the timesheet entry(In case of employee role they can select their employee only).
 * @param open - Boolean value to open the dialog.
 * @param onOpenChange - Function to change the open state of the dialog.
 * @param workingFrequency - Working frequency of the employee.(Used to calculating remaining hours).
 * @param workingHours - Working hours of the employee.(Used to calculating remaining hours).
 * @param onSuccess - Function to call after successfully adding the timesheet entry.
 * @param task - Task name for the timesheet entry (eg: TASK-0001).
 * @param project - Project name for the timesheet entry (eg: Project-0001).
 */
const AddTime = ({
  initialDate,
  employee,
  employeeName,
  open = false,
  onOpenChange,
  workingFrequency,
  workingHours,
  onSuccess,
  task = "",
  project = "",
}: AddTimeProps) => {
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const { call: save } = useFrappePostCall("next_pms.timesheet.api.timesheet.save");
  const [searchTask, setSearchTask] = useState(task);
  const [tasks, setTask] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>(project);
  const [selectedDate, setSelectedDate] = useState(getFormatedDate(initialDate));
  const [selectedEmployee, setSelectedEmployee] = useState(employee);
  const expectedHours = expectatedHours(workingHours, workingFrequency);
  const { toast } = useToast();

  const { data: projectsData } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    fields: ["name", "project_name"],
    filters: window.frappe?.boot?.global_filters.project,
    limit_page_length: "null",
  });

  const projectOptions = ((projectsData?.message ?? []) as ProjectData[]).map((project) => ({
    label: project.project_name,
    value: project.name,
  }));

  const { data: tasksData, mutate:mutateTasksData } = useFrappeGetCall("next_pms.timesheet.api.task.get_task_list", {
    search: searchTask,
    projects: [selectedProject],
    page_length: 100,
    filter_recent: true,
  });

  useEffect(()=>{
    console.log(selectedProject);
    mutateTasksData()
  },[selectedProject])

  const tasksOptions = ((tasksData?.message?.task ?? []) as TaskItem[]).map((task) => ({
    label: task.subject,
    value: task.name,
  }));

  const form = useForm({
    defaultValues: {
      project: "",
      task: task,
      date: initialDate,
      duration: 0,
      comment: "",
    },
    validators: {
      onSubmit: addTimeFormSchema,
    },
    onSubmit: async ({ value }) => {
      console.log(value);
    },
  });

  const handleOpen = () => {
    if (submitting) return;
    form.reset();
    onOpenChange(form.state.values);
  };
  const handleSubmit = (data: z.infer<typeof TimesheetSchema>) => {
    setSubmitting(true);
    save(data)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        onSuccess?.(form.state.values);
        setSubmitting(false);
        handleOpen();
      })
      .catch((err) => {
        setSubmitting(false);
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };

  const { data: remainingHoursData , mutate: mutateRemainingHoursData } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_remaining_hour_for_employee",
    {
      employee: selectedEmployee,
      date: selectedDate,
    },
    undefined,
    {
      revalidateOnFocus: false,
    },
  );

  const remainingHours = remainingHoursData?.message ?? 8

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpen}
      actions={<Button className="w-full" variant="solid" label="Save entry" />}
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
                <label className="block text-xs text-ink-gray-5">Project</label>
                <Combobox
                  inputClassName="bg-white h-8 border-outline-gray-2"
                  options={projectOptions}
                  placeholder="Select Project"
                  value={field.state.value}
                  onChange={(val) => {
                    field.handleChange(val as string)
                    setSelectedProject(val);
                }}
                />
                {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
              </>
            );
          }}
        />
        <form.Field
          name="task"
          children={(field) => {
            return (
            <>
                <label className="block text-xs text-ink-gray-5">Task</label>
                <Combobox
                  inputClassName="bg-white h-8 border-outline-gray-2"
                  options={tasksOptions}
                  placeholder="Select Task"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val as string)}
                />
                {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
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
                  <DatePicker label="From" onChange={() => {}} placeholder="Placeholder" value="">
                    {({ displayValue }) => {
                      return (
                        <div className=" flex-1 flex w-full flex-col space-y-1.5 ">
                          <label className="block text-xs text-ink-gray-5">Date</label>
                          <div
                            className={`relative flex items-center border border-outline-gray-2 px-[10px] py-1 rounded-lg`}
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
                  {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
                </>
              );
            }}
          />
          <form.Field
            name="duration"
            children={(field) => {
              return (
                <>
                  <form.Field
                    name="date"
                    children={(field) => {
                      return (
                        <div className="w-full flex flex-col gap-2">
                            <DurationInput/>
                          {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
                        </div>
                      );
                    }}
                  />
                  {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
                </>
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
                <Textarea className="bg-white border-outline-gray-2" />
                {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
              </>
            );
          }}
        />
      </div>
    </Dialog>
  );
};

export default AddTime;
