import { useForm } from "react-hook-form";
import {
  Dialog,
  CustomDialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, parseFrappeErrorMsg, getFormatedDate } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { DialogProps } from "@/app/types/timesheet";
import { ScreenLoader } from "@/app/components/Loader";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/app/state/store";
import { getInitialState } from "@/app/reducer/timesheet";

interface Task {
  name: string;
  subject: string;
}

export default function TimesheetDialog({
  dialogState,
  dispatch,
}: DialogProps) {
  const employee = useSelector((state: RootState) => state.employee);
  const [selectedDate, setSelectedDate] = useState<string>(
    getFormatedDate(new Date())
  );
  const [isComboOpen, setIsComboOpen] = useState(false);
  const { toast } = useToast();
  const { call } = useFrappePostCall("timesheet_enhancer.api.timesheet.save");

  useEffect(() => {
    if (!dialogState.timesheet.date) return;
    const date = getFormatedDate(dialogState.timesheet.date);
    setSelectedDate(date);
  }, []);

  const FormSchema = z.object({
    task: z.string({
      required_error: "Please select a task.",
    }),
    name: z.string({}),
    hours: z
      .number({
        required_error: "Please enter hours.",
      })
      .max(8, "Hours should be less than 8.")
      .min(0, "Hours should be greater than 0."),
    date: z.string({
      required_error: "Please enter date.",
    }),
    description: z.string({
      required_error: "Please enter description.",
    }),
    parent: z.string({}),
    is_update: z.boolean({}),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: dialogState.timesheet.name,
      task: dialogState.timesheet.task,
      hours: dialogState.timesheet.hours,
      description: dialogState.timesheet.description,
      date: dialogState.timesheet.date,
      parent: dialogState.timesheet.parent,
      is_update: dialogState.timesheet.isUpdate,
    },
  });
  const {
    isLoading,
    data: tasks,
    error,
  } = useFrappeGetCall<{ message: [Task] }>(
    "frappe.client.get_list",
    {
      doctype: "Task",
      fields: ["name", "subject"],
    },
    "tasks",
    {
      dedupingInterval: 1000 * 60 * 5,
    }
  );

  const {
    isLoading: isDateLoading,
    data: leaveAndHolidayDates,
    error: dateError,
  } = useFrappeGetCall<{ message: string[] }>(
    "timesheet_enhancer.api.timesheet.get_employee_holidays_and_leave_dates",
    { employee: employee.value },
    "leavesAndHoliday",
    {
      dedupingInterval: 1000 * 60 * 5,
    }
  );

  if (isLoading || isDateLoading) {
    return <ScreenLoader isFullPage={false} />;
  }
  function closeDialog() {
    dispatch({ type: "SetTimesheet", payload: getInitialState.timesheet });
    dispatch({ type: "SetDialog", payload: false });
  }
  function onSubmit(values: z.infer<typeof FormSchema>) {
    call(values)
      .then((res) => {
        dispatch({ type: "SetDialog", payload: false });
        dispatch({ type: "SetFetchAgain", payload: true });

        toast({
          variant: "success",
          title: res.message,
        });
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err._server_messages);
        toast({
          variant: "destructive",
          title: error.message ?? error,
        });
      });
  }

  return (
    <Dialog open={dialogState.isDialogOpen}>
      <CustomDialogContent
        className="sm:max-w-md timesheet-dialog"
        isCloseButton={true}
        closeAction={closeDialog}
      >
        <DialogHeader>
          <DialogTitle>Add Time</DialogTitle>
        </DialogHeader>
        <hr />
        <div>
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex gap-2.5">
                <FormField
                  name="hours"
                  render={({ field }) => (
                    <FormItem className="flex flex-col flex-[1_1_50%]">
                      <div>
                        <FormLabel>Hours</FormLabel>
                        <sup className="text-destructive text-sm align-sub">
                          *
                        </sup>
                      </div>
                      <FormControl>
                        <div className="flex justify-between gap-1">
                          <Button
                            type="button"
                            onClick={() => {
                              if (field.value === 0) return;
                              form.setValue("hours", field.value - 0.5);
                            }}
                          >
                            -
                          </Button>
                          <Input
                            className=""
                            type="text"
                            placeholder="Hours"
                            value={field.value}
                            defaultValue={dialogState.timesheet.hours}
                            onChange={(event) => {
                              if (!event.target.value) {
                                field.onChange(0);
                                return;
                              }
                              const time = parseFloat(event.target.value);
                              if (time > 8 || time < 0) return;
                              field.onChange(time);
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              if (field.value === 8) return;
                              form.setValue("hours", field.value + 0.5);
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col flex-[1_1_50%]">
                      <div>
                        <FormLabel>Date</FormLabel>
                        <sup className="text-destructive text-sm align-sub">
                          *
                        </sup>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            disabled={dialogState.timesheet.date ? true : false}
                            variant={"outline"}
                            className={cn(
                              "w-auto justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              field.value
                            ) : (
                              <span>{selectedDate}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={new Date(selectedDate)}
                            disableNavigation
                            disabled={convertStringsToDates(
                              leaveAndHolidayDates?.message
                            )}
                            onSelect={(date) => {
                              if (!date) return;
                              const d = getFormatedDate(date);
                              setSelectedDate(d);
                              field.onChange(d);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                name="task"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <div>
                      <FormLabel>Task</FormLabel>
                      <sup className="text-destructive text-sm align-sub">
                        *
                      </sup>
                    </div>
                    <Popover open={isComboOpen} onOpenChange={setIsComboOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="max-w-full px-1 justify-between"
                            disabled={dialogState.timesheet.task ? true : false}
                          >
                            {field.value ? (
                              tasks?.message.find(
                                (task: Task) => task.name === field.value
                              )?.subject
                            ) : (
                              <div className="flex justify-center items-center">
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />{" "}
                                <p className="ml-2 shrink-0 opacity-50">
                                  Select Task...
                                </p>{" "}
                              </div>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Command>
                          <CommandInput placeholder="Search task..." />
                          <CommandEmpty>No task found.</CommandEmpty>
                          <CommandGroup>
                            <CommandList>
                              {tasks?.message.map((task: Task) => (
                                <CommandItem
                                  className="hover:cursor-pointer"
                                  key={task.name}
                                  value={task.subject}
                                  onSelect={(value) => {
                                    form.setValue("task", task.name);
                                    setIsComboOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === task.name
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {task.subject}
                                </CommandItem>
                              ))}
                            </CommandList>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="description"
                render={({ field }) => (
                  <FormItem className="flex flex-col ">
                    <div>
                      <FormLabel>Description</FormLabel>
                      <sup className="text-destructive text-sm align-sub">
                        *
                      </sup>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Explain your progress..."
                        {...field}
                        required
                        onChange={(event) => {
                          field.onChange(event.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
}

function convertStringsToDates(dateStrings: string[] | undefined) {
  let dates: Date[] = [];
  if (dateStrings) {
    dates = dateStrings.map((dateString: string) => new Date(dateString));
  }

  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth();
  const dayOfMonth = today.getDate();

  // Calculate the first day of the current week (Sunday)
  const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const firstDayOfCurrentWeek = new Date(year, month, dayOfMonth - dayOfWeek);

  // Loop from the start of the month to the day before the first day of the current week
  for (let day = 1; day < firstDayOfCurrentWeek.getDate(); day++) {
    dates.push(new Date(year, month, day));
  }

  // Calculate the last day of the current month
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  // Loop from tomorrow to the last day of the month
  for (let day = dayOfMonth + 1; day <= lastDayOfMonth; day++) {
    dates.push(new Date(year, month, day));
  }
  return dates;
}
