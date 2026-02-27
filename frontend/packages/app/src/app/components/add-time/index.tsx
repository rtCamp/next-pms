/**
 * External Dependencies
 */
import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useToast,
  //   Button,
  //   Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
  ComboBox,
  //   DatePicker,
  Typography,
  TextEditor,
} from "@next-pms/design-system/components";
import { DatePicker, Dialog, Button, TabButtons, Select, Textarea, TextInput } from "@rtcamp/frappe-ui-react";
import { getFormatedDate } from "@next-pms/design-system/date";
import { floatToTime } from "@next-pms/design-system/utils";
import { FrappeConfig, FrappeContext, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Calendar, CalendarX2, LoaderCircle, Save, Search, X } from "lucide-react";
import { z } from "zod";

/**
 * Internal Dependencies
 */
import EmployeeCombo from "@/app/components/employeeComboBox";
import { mergeClassNames, expectatedHours, parseFrappeErrorMsg } from "@/lib/utils";
import { TimesheetSchema } from "@/schema/timesheet";
import type { TaskData } from "@/types";
import TimeSelector from "./time-selector";
import type { AddTimeProps } from "./type";

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
  const [selectedProject, setSelectedProject] = useState<string[]>(project ? [project] : []);
  const [selectedDate, setSelectedDate] = useState(getFormatedDate(initialDate));
  const [selectedEmployee, setSelectedEmployee] = useState(employee);
  const expectedHours = expectatedHours(workingHours, workingFrequency);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof TimesheetSchema>>({
    resolver: zodResolver(TimesheetSchema),
    defaultValues: {
      task: task,
      hours: "",
      description: "",
      date: initialDate,
      employee: employee,
    },
    mode: "onSubmit",
  });
  const handleOpen = () => {
    if (submitting) return;
    form.reset();
    onOpenChange(form.getValues());
  };
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    form.setValue("date", getFormatedDate(date), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setSelectedDate(getFormatedDate(date));
  };
  const handleTaskSearch = (searchTerm: string) => {
    setSearchTask(searchTerm);
  };
  const UpdateTime = (time: string) => {
    form.setValue("hours", time, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };
  const handleTaskChange = (value: string | string[]) => {
    if (value instanceof Array) {
      form.setValue("task", value[0], {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    } else {
      form.setValue("task", value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
    updateProject(value[0]);
  };
  const updateProject = useCallback(
    (value: string) => {
      if (selectedProject.length === 0) {
        tasks.find((item: TaskData) => {
          if (item.name === value) {
            setSelectedProject([item.project]);
          }
        });
      }
    },
    [selectedProject, tasks],
  );
  const handleProjectChange = (value: string | string[]) => {
    if (value instanceof Array) {
      setSelectedProject(value);
    } else {
      setSelectedProject([value]);
    }
    setSearchTask("");
    form.setValue("task", "", {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };
  const handleSubmit = (data: z.infer<typeof TimesheetSchema>) => {
    setSubmitting(true);
    save(data)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        onSuccess?.(form.getValues());
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
  const fetchTask = useCallback(() => {
    setIsTaskLoading(true);
    call
      .get("next_pms.timesheet.api.task.get_task_list", {
        search: searchTask,
        projects: selectedProject,
        page_length: 100,
        filter_recent: true,
      })
      .then((res) => {
        setTask(res.message.task);
        setIsTaskLoading(false);
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
        setIsTaskLoading(false);
      });
  }, [call, searchTask, selectedProject, toast]);

  const { data: projects, isLoading: isProjectLoading } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    fields: ["name", "project_name"],
    filters: window.frappe?.boot?.global_filters.project,
    limit_page_length: "null",
  });

  const { data: perDayEmpHours, mutate: mutatePerDayHrs } = useFrappeGetCall(
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
  const onEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    form.setValue("employee", value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  useEffect(() => {
    updateProject(task);
  }, [task, updateProject]);
  useEffect(() => {
    fetchTask();
  }, [fetchTask, searchTask, selectedProject]);

  useEffect(() => {
    mutatePerDayHrs();
  }, [mutatePerDayHrs, selectedDate, selectedEmployee]);

  const {
    formState: { isDirty, isValid },
  } = form;

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
        <label className="block text-xs text-ink-gray-5">Project</label>
        <Select
          options={[
            {
              label: "Paid time-off",
              value: "paid",
            },
            {
              label: "Unpaid time-off",
              value: "unpaid",
            },
            {
              label: "Paternity time-off",
              value: "paternity",
            },
          ]}
          value="without-pay"
        />
        <label className="block text-xs text-ink-gray-5">Task</label>
        <Select
          options={[
            {
              label: "Paid time-off",
              value: "paid",
            },
            {
              label: "Unpaid time-off",
              value: "unpaid",
            },
            {
              label: "Paternity time-off",
              value: "paternity",
            },
          ]}
          value="without-pay"
        />
        <div className="flex gap-4">
          <DatePicker label="From" onChange={() => {}} placeholder="Placeholder" value="">
            {({ displayValue }) => {
              return (
                <div className=" flex-1 flex w-full flex-col space-y-1.5 ">
                  <label className="block text-xs text-ink-gray-5">From</label>
                  <div className={`relative flex items-center border border-outline-gray-2 px-[10px] py-2 rounded-lg`}>
                    <input type="text" id="start" value={displayValue} className={`flex-1`} placeholder="Today" />
                    <Calendar className="size-4" />
                  </div>
                </div>
              );
            }}
          </DatePicker>
          <div className="space-y-4">
            <label className="block text-xs text-ink-gray-5">Duration Time</label>
            <Select
              options={[
                {
                  label: "Paid time-off",
                  value: "paid",
                },
                {
                  label: "Unpaid time-off",
                  value: "unpaid",
                },
                {
                  label: "Paternity time-off",
                  value: "paternity",
                },
              ]}
              value="without-pay"
            />
          </div>
        </div>
        <label className="block text-xs text-ink-gray-5">Comment</label>
        <Textarea className="bg-white border-outline-gray-2" />
      </div>
    </Dialog>
  );
};

export default AddTime;
