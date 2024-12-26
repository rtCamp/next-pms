/**
 * External Dependencies
 */
import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FrappeConfig, FrappeContext, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Clock3, LoaderCircle, Save, Search, X } from "lucide-react";
import { z } from "zod";

/**
 * Internal Dependencies
 */
import { ComboxBox } from "@/app/components/comboBox";
import { DatePicker } from "@/app/components/datePicker";
import EmployeeCombo from "@/app/components/employeeComboBox";
import { Typography } from "@/app/components/typography";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/components/ui/use-toast";
import { floatToTime } from "@/lib/utils";
import { cn, expectatedHours, getFormatedDate, parseFrappeErrorMsg } from "@/lib/utils";
import { TimesheetSchema } from "@/schema/timesheet";
import { WorkingFrequency, TaskData } from "@/types";

interface AddTimeProps {
  initialDate: string;
  employee: string;
  open: boolean;
  onOpenChange: () => void;
  workingHours: number;
  onSuccess?: () => void;
  workingFrequency: WorkingFrequency;
  task?: string;
  project?: string;
}

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
    onOpenChange();
  };
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    form.setValue("date", getFormatedDate(date));
    setSelectedDate(getFormatedDate(date));
  };
  const handleTaskSearch = (searchTerm: string) => {
    setSearchTask(searchTerm);
  };
  const handleTaskChange = (value: string | string[]) => {
    if (value instanceof Array) {
      form.setValue("task", value[0]);
    } else {
      form.setValue("task", value);
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
    form.setValue("task", "");
  };
  const handleSubmit = (data: z.infer<typeof TimesheetSchema>) => {
    setSubmitting(true);
    save(data)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        onSuccess && onSuccess();
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
    call
      .get("next_pms.timesheet.api.task.get_task_list", {
        search: searchTask,
        projects: selectedProject,
        page_length: 100,
      })
      .then((res) => {
        setTask(res.message.task);
      });
  }, [call, searchTask, selectedProject]);

  const { data: projects } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    fields: ["name", "project_name"],
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
    }
  );
  const onEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    form.setValue("employee", value);
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
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-xl" onPointerDownOutside={event?.preventDefault}>
        <DialogHeader>
          <DialogTitle className="flex gap-x-2">
            Add Time
            <Typography
              variant="p"
              className={cn(
                Number(perDayEmpHours?.message) >= 0 && Number(perDayEmpHours?.message) <= expectedHours
                  ? "text-success"
                  : "text-destructive"
              )}
            >
              {perDayEmpHours
                ? `${floatToTime(Math.abs(perDayEmpHours?.message))} hrs ${
                    perDayEmpHours?.message < 0 ? "extended" : "remaining"
                  }`
                : ""}
            </Typography>
          </DialogTitle>
          <Separator />
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="flex flex-col gap-y-4">
              <div className="grid max-sm:gap-y-4 sm:gap-x-4 max-sm:grid-rows-2 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="employee"
                  render={() => (
                    <FormItem className="w-full space-y-1">
                      <FormLabel className="flex gap-2 items-center text-sm">Employee</FormLabel>
                      <FormControl>
                        <EmployeeCombo onSelect={onEmployeeChange} value={selectedEmployee} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-x-4">
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
                            <div className="relative flex items-center">
                              <Input
                                placeholder="00:00"
                                className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                                type="text"
                                {...field}
                              />
                              <Clock3 className="h-4 w-4 absolute right-0 m-3 top-0 stroke-slate-400" />
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
              </div>
              <div className="grid gap-x-4 grid-cols-2">
                <FormItem className="space-y-1">
                  <FormLabel>Projects</FormLabel>
                  <ComboxBox
                    label="Search Projects"
                    showSelected
                    shouldFilter
                    value={selectedProject}
                    data={projects?.message?.map((item: { project_name: string; name: string }) => ({
                      label: item.project_name,
                      value: item.name,
                      disabled: false,
                    }))}
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
                        <ComboxBox
                          label="Search Task"
                          showSelected
                          deBounceTime={200}
                          value={
                            form.getValues("task") && form.getValues("task").length > 0 ? [form.getValues("task")] : []
                          }
                          data={
                            tasks.map((item: TaskData) => ({
                              label: item.subject,
                              value: item.name,
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
                      <Textarea
                        placeholder="Explain your progress"
                        rows={4}
                        className="w-full placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field}
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
                    Add Time
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
  );
};

export default AddTime;
