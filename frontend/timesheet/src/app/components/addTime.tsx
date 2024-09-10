import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { WorkingFrequency, TaskData } from "@/types";
import { useContext, useEffect, useState } from "react";
import { cn, expectatedHours, getFormatedDate, parseFrappeErrorMsg } from "@/lib/utils";
import { floatToTime } from "@/lib/utils";
import { TimesheetSchema } from "@/schema/timesheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";
import { Clock3, LoaderCircle, Search } from "lucide-react";
import { DatePicker } from "./datePicker";
import { Typography } from "./typography";
import { Input } from "@/app/components/ui/input";
import { ComboxBox } from "./comboBox";
import { FrappeConfig, FrappeContext, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useToast } from "./ui/use-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface AddTimeProps {
  initialDate: string;
  employee: string;
  open: boolean;
  onOpenChange: () => void;
  workingHours: number;
  onSuccess?: () => void;
  workingFrequency: WorkingFrequency;
}

const AddTime = ({
  initialDate,
  employee,
  open = false,
  onOpenChange,
  workingFrequency,
  workingHours,
  onSuccess,
}: AddTimeProps) => {
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const userState = useSelector((state: RootState) => state.user);
  const hasAccess =
    userState.roles.includes("Projects Manager") ||
    userState.roles.includes("Timesheet Manager") ||
    userState.roles.includes("System Manager");
  const { call: save } = useFrappePostCall("frappe_pms.timesheet.api.timesheet.save");
  const [searchTask, setSearchTask] = useState("");
  const [tasks, setTask] = useState([]);
  const [selectedProject, setSelectedProject] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(getFormatedDate(initialDate));
  const expectedHours = expectatedHours(workingHours, workingFrequency);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof TimesheetSchema>>({
    resolver: zodResolver(TimesheetSchema),
    defaultValues: {
      name: "",
      task: "",
      hours: floatToTime(0),
      description: "",
      date: initialDate,
      employee: employee,
    },
    mode: "onSubmit",
  });
  const handleOpen = () => {
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
  };
  const handleProjectChange = (value: string | string[]) => {
    if (value instanceof Array) {
      setSelectedProject(value);
    } else {
      setSelectedProject([value]);
    }
    form.setValue("task", "");
  };
  const handleSubmit = (data: z.infer<typeof TimesheetSchema>) => {
    save(data)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        onSuccess && onSuccess();
        handleOpen();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };
  const fetchTask = () => {
    call
      .get("frappe_pms.timesheet.api.task.get_task_list", {
        search: searchTask,
        projects: selectedProject,
      })
      .then((res) => {
        setTask(res.message.task);
      });
  };

  const { data: projects } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    fields: ["name", "project_name"],
    limit_page_length: "null",
  });

  const { data: perDayEmpHours, mutate: mutatePerDayHrs } = useFrappeGetCall(
    "frappe_pms.timesheet.api.timesheet.get_remaining_hour_for_employee",
    {
      employee: employee,
      date: selectedDate,
    },
  );

  const { data: employeeDetail } = useFrappeGetCall("frappe_pms.timesheet.api.employee.get_employee", {
    filters: [["name", "=", employee]],
  });

  useEffect(() => {
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTask, selectedProject]);

  useEffect(() => {
    mutatePerDayHrs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);
  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Time</DialogTitle>
          <Separator />
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="flex flex-col gap-y-1">
              <div className={cn("grid gap-x-4 grid-cols-2", hasAccess && "grid-cols-3")}>
                {hasAccess && (
                  <FormField
                    control={form.control}
                    name="employee"
                    render={() => (
                      <FormItem className="w-full">
                        <FormLabel className="flex gap-2 items-center text-sm">Employee</FormLabel>
                        <FormControl>
                          <div className="relative flex items-center max-w-48 overflow-hidden">
                            <Button
                              variant="outline"
                              className="justify-start gap-x-3 font-normal w-full truncate"
                              disabled
                            >
                              {employeeDetail && employeeDetail.message ? (
                                <>
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={employeeDetail.message?.image} alt="image" />
                                    <AvatarFallback>{employeeDetail.message?.employee_name[0]}</AvatarFallback>
                                  </Avatar>
                                  <Typography variant="p" className="truncate">
                                    {employeeDetail.message?.employee_name}
                                  </Typography>
                                </>
                              ) : (
                                "select employee"
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="flex gap-2 items-center">
                        <p className="text-sm">Time</p>
                        {perDayEmpHours && (
                          <Typography
                            variant="p"
                            className={cn(
                              Number(perDayEmpHours?.message) >= 0 && Number(perDayEmpHours?.message) <= expectedHours
                                ? "text-success"
                                : "text-destructive",
                            )}
                          >
                            {`${floatToTime(Math.abs(perDayEmpHours?.message))} hrs ${
                              perDayEmpHours?.message < 0 ? "extended" : "remaining"
                            }`}
                          </Typography>
                        )}
                      </FormLabel>
                      <FormControl>
                        <>
                          <div className="relative flex items-center">
                            <Input
                              placeholder="00:00"
                              className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                              type="text"
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
                    <FormItem className="w-full">
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
                <FormItem>
                  <FormLabel>Projects</FormLabel>
                  <ComboxBox
                    label="Search Projects"
                    showSelected
                    shouldFilter
                    value={selectedProject}
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //  @ts-expect-error
                    data={projects?.message?.map((item) => ({
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
                    <FormItem>
                      <FormLabel>Tasks</FormLabel>
                      <FormControl>
                        <ComboxBox
                          label="Search Task"
                          showSelected
                          value={form.getValues("task").length > 0 ? [form.getValues("task")] : []}
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
                          rightIcon={<Search className="!h-4 !w-4 stroke-slate-400" />}
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
                  <FormItem>
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
                  <Button disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <LoaderCircle className="animate-spin w-4 h-4" />}
                    Add Time
                  </Button>
                  <Button variant="secondary" type="button">
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
