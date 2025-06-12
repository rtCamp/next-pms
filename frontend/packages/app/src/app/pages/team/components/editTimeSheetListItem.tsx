/**
 * External Dependencies
 */
import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { floatToTime, getDateFromDateAndTimeString, getFormatedDate } from "@next-pms/design-system";
import {
  useToast,
  Button,
  Dialog,
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
  DatePicker,
  TextEditor,
} from "@next-pms/design-system/components";
import { FrappeConfig, FrappeContext, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { CircleDollarSign, LoaderCircle, Save, Search, X } from "lucide-react";
import { z } from "zod";
import TimeSelector from "@/app/components/add-time/time-selector";

/**
 * Internal Dependencies
 */
import EmployeeCombo from "@/app/components/employeeComboBox";
import { mergeClassNames, parseFrappeErrorMsg } from "@/lib/utils";
import { EditTimesheetSchema } from "@/schema/timesheet";
import type { TaskData } from "@/types";
import { EditTimeSheetListItemProps } from "./types";

/**
 * EditTimeSheetListItem Component
 * @description This component is used to show dialog to the user to edit TimeSheetListItem.
 * User can update the  date, time, project, task and
 * and description for the TimeSheetListItem.
 * @param employee - Employee for the timesheet entry(In case of employee role they can select their employee only).
 * @param open - Boolean value to open the dialog.
 * @param onOpenChange - Function to change the open state of the dialog.
 * @param onSuccess - Function to call after successfully updating the TimeSheetListItem.
 * @param task - Task object for the timesheet entry.
 */
const EditTimeSheetListItem = ({
  employee,
  open = false,
  onOpenChange,
  onSuccess,
  task,
}: EditTimeSheetListItemProps) => {
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const [searchTask, setSearchTask] = useState(task.subject);
  const [tasks, setTask] = useState<Array<TaskData>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string[]>(task.project_name ? [task.project || ""] : []);
  const [selectedEmployee, setSelectedEmployee] = useState(employee);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof EditTimesheetSchema>>({
    resolver: zodResolver(EditTimesheetSchema),
    defaultValues: {
      task: task.subject,
      hours: String(floatToTime(task.hours)),
      description: task.description,
      date: getDateFromDateAndTimeString(task.from_time),
      employee: employee,
      is_billable: Boolean(task.is_billable),
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
    [selectedProject, tasks]
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
  const { call: updateTimesheet } = useFrappePostCall("next_pms.timesheet.api.timesheet.update_timesheet_detail");

  const handleTimeSheetUpdate = (value: {
    name: string;
    parent: string;
    is_billable: boolean;
    hours: number;
    employee: string;
    description: string;
    date: string;
    task: string;
  }) => {
    updateTimesheet(value)
      .then((res) => {
        onSuccess?.({});
        toast({
          variant: "success",
          description: res.message,
        });
        handleOpen();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleSubmit = (data: z.infer<typeof EditTimesheetSchema>) => {
    setSubmitting(true);
    const foundTask = tasks.find((task) => task?.subject === form.getValues("task"));
    const { name, parent } = task;
    const { is_billable, hours, employee, description, date } = data;
    const task_name = foundTask?.name;
    handleTimeSheetUpdate({
      name,
      parent,
      task: task_name || task.task,
      is_billable,
      hours: Number(hours),
      employee,
      description,
      date,
    });
  };
  const fetchTask = useCallback(() => {
    setIsTaskLoading(true);
    call
      .get("next_pms.timesheet.api.task.get_task_list", {
        search: searchTask,
        projects: selectedProject,
        page_length: 100,
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
    limit_page_length: "null",
  });
  const { data: employee_name } = useFrappeGetCall(
    "next_pms.timesheet.api.employee.get_employee",
    {
      filters: { name: employee },
    },
    "teamdetail/" + employee,
    {
      errorRetryCount: 1,
      revalidateOnFocus: true,
      revalidateIfStale: false,
    }
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
    updateProject(task.subject || "");
  }, [task, updateProject]);
  useEffect(() => {
    fetchTask();
  }, [fetchTask, searchTask, selectedProject]);
  const {
    formState: { isDirty, isValid },
  } = form;
  return (
    <>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex gap-x-2">Edit TimeSheet</DialogTitle>
            <Separator />
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex flex-col gap-y-4">
                <div className="grid max-sm:gap-y-4 gap-x-4 grid-cols-5">
                  <FormField
                    control={form.control}
                    name="employee"
                    render={() => (
                      <FormItem className="w-full space-y-1 col-span-4">
                        <FormLabel className="flex gap-2 items-center text-sm">Employee</FormLabel>
                        <FormControl>
                          <EmployeeCombo
                            onSelect={onEmployeeChange}
                            value={selectedEmployee}
                            employeeName={employee_name?.message?.employee_name || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_billable"
                    render={({ field }) => (
                      <FormItem className="w-full space-y-1 col-span-1">
                        <FormLabel className="flex gap-2 items-center text-sm">Billing</FormLabel>
                        <FormControl>
                          <div
                            className={mergeClassNames(
                              "flex items-center justify-center cursor-pointer rounded-sm py-3 px-1",
                              field.value ? "bg-gradient-to-r from-green-300 to-green-600" : "bg-yellow-500"
                            )}
                            onClick={() =>
                              form.setValue("is_billable", !field.value, {
                                shouldValidate: true,
                                shouldDirty: true,
                                shouldTouch: true,
                              })
                            }
                          >
                            <CircleDollarSign size={36} className="text-white" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-x-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name="hours"
                    render={({ field }) => (
                      <FormItem className="w-full space-y-1">
                        <FormLabel className="flex gap-2 items-center">
                          <p className="text-sm">Time</p>
                        </FormLabel>
                        <FormControl>
                          <>
                            <div className=" flex w-full border rounded-md ">
                              <Input
                                placeholder="00:00"
                                className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 border-r rounded-none px-2"
                                type="text"
                                {...field}
                              />
                              <TimeSelector onClick={UpdateTime} />
                            </div>
                          </>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="w-full space-y-1">
                        <FormLabel className="flex gap-2 items-center text-sm">Date</FormLabel>
                        <FormControl>
                          <DatePicker date={field.value} onDateChange={handleDateChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-x-4 grid-cols-2">
                  <FormItem className="space-y-1">
                    <FormLabel>Projects</FormLabel>
                    <ComboBox
                      label="Search Projects"
                      showSelected
                      shouldFilter
                      value={selectedProject}
                      data={projects?.message?.map((item: { project_name: string; name: string }) => ({
                        label: item.project_name,
                        value: item.name,
                        disabled: false,
                      }))}
                      isLoading={isProjectLoading}
                      onSelect={handleProjectChange}
                      rightIcon={<Search className="h-4 w-4 stroke-slate-400" />}
                    />
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="task"
                    render={() => (
                      <FormItem className="space-y-1">
                        <FormLabel>Tasks</FormLabel>
                        <FormControl>
                          <ComboBox
                            label="Search Task"
                            showSelected
                            deBounceTime={200}
                            value={
                              form.getValues("task") && form.getValues("task").length > 0
                                ? [form.getValues("task")]
                                : []
                            }
                            isLoading={isTaskLoading}
                            data={
                              tasks.map((item: TaskData) => ({
                                label: item.subject,
                                value: item.subject,
                                description: item.project_name as string,
                                disabled: false,
                              })) ?? []
                            }
                            onSelect={handleTaskChange}
                            onSearch={handleTaskSearch}
                            rightIcon={<Search className="h-4 w-4  stroke-slate-400" />}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Comment</FormLabel>
                      <FormControl>
                        <TextEditor
                          placeholder="Explain your progress"
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="sm:justify-start w-full pt-3">
                  <div className="flex gap-x-4 w-full">
                    <Button disabled={!isDirty || !isValid || submitting}>
                      {submitting ? <LoaderCircle className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                      Update Timesheet
                    </Button>
                    <Button variant="secondary" type="button" onClick={handleOpen} disabled={submitting}>
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditTimeSheetListItem;
