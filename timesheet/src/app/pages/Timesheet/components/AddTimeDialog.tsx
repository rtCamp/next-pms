import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScreenLoader } from "@/app/components/Loader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogProps } from "@/app/types/timesheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFormatedDate, cn, parseFrappeErrorMsg } from "@/app/lib/utils";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/state/store";
import { Check, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { getInitialState } from "@/app/reducer/timesheet";
import { Clock2, Calendar as CalIcon } from "@/app/components/Icon";

interface Task {
  name: string;
  subject: string;
}

export function AddTimeDialog({ state, dispatch }: DialogProps) {
  const employee = useSelector((state: RootState) => state.employee);
  const roles = useSelector((state: RootState) => state.roles);
  const isManager = roles.value.includes("Projects Manager");
  const [selectedDate, setSelectedDate] = useState<string>(
    getFormatedDate(new Date())
  );
  const [isOpen, setIsOpen] = useState(state.isAddTimeDialogOpen);
  const [isComboOpen, setIsComboOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { toast } = useToast();
  const { call } = useFrappePostCall("timesheet_enhancer.api.timesheet.save");

  const FormSchema = z.object({
    task: z.string({
      required_error: "Please select a task.",
    }),
    name: z.string({}),
    hours: z
      .string()
      .refine(
        (value) => !isNaN(parseFloat(value)) && /^\d+(\.\d)?$/.test(value),
        {
          message: "Hours must be a number with at most one decimal place",
        }
      ),
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
      name: state.timesheet.name,
      task: state.timesheet.task,
      hours: state.timesheet.hours.toString(),
      description: state.timesheet.description,
      date: state.timesheet.date,
      parent: state.timesheet.parent,
      is_update: state.timesheet.isUpdate,
    },
    mode: "onBlur",
  });

  const {
    isLoading: isTaskLoading,
    data: tasks,
    error: taskError,
  } = useFrappeGetCall<{ message: [Task] }>(
    "frappe.client.get_list",
    {
      doctype: "Task",
      fields: ["name", "subject"],
    },
    "tasks"
  );

  const {
    isLoading: isDateLoading,
    data: leaveAndHolidayDates,
    error: dateError,
  } = useFrappeGetCall<{ message: string[] }>(
    "timesheet_enhancer.api.timesheet.get_employee_holidays_and_leave_dates",
    { employee: employee.value },
    "leavesAndHoliday"
  );

  useEffect(() => {
    if (!state.timesheet.date) return;
    const date = getFormatedDate(state.timesheet.date);
    setSelectedDate(date);
    form.setValue("date", date);
  }, [state.timesheet.date]);

  const handleDatePickerState = () => {
    setIsDatePickerOpen(!isDatePickerOpen);
  };
  const closeDialog = () => {
    dispatch({ type: "SetTimesheet", payload: getInitialState.timesheet });
    setIsOpen(false);
    setTimeout(() => {
      dispatch({ type: "SetAddTimeDialog", payload: false });
    }, 500);
  };
  const onTaskSelect = (task: string) => {
    form.setValue("task", task);
    setIsComboOpen(false);
  };
  const onDateSelect = (
    day: Date | undefined,
    selectedDay: Date,
    activeModifiers: any,
    e: React.MouseEvent<Element, globalThis.MouseEvent>
  ) => {
    if (!day) return;
    const d = getFormatedDate(day);
    setSelectedDate(d);
    form.setValue("date", d);
    handleDatePickerState();
  };
  function onSubmit(values: z.infer<typeof FormSchema>) {
    call(values)
      .then((res) => {
        closeDialog();
        dispatch({ type: "SetFetchAgain", payload: true });
        toast({
          variant: "success",
          title: res.message,
        });
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          title: error.message,
        });
      });
  }
  return (
    <Sheet open={isOpen} onOpenChange={closeDialog}>
      {isTaskLoading || isDateLoading ? (
        <></>
      ) : (
        <SheetContent className="sm:max-w-xl px-11 py-6">
          <SheetHeader>
            <SheetTitle className="font-bold">Add Time</SheetTitle>
          </SheetHeader>
          <Separator className="my-6" />
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex gap-x-7 ">
                  <FormField
                    name="hours"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <div className="leading-[14px]">
                          <FormLabel>Time</FormLabel>
                          <sup className="text-destructive text-sm align-sub">
                            *
                          </sup>
                        </div>
                        <FormControl>
                          <div className="flex justify-between gap-1 !mt-0 relative w-full">
                            <Input
                              className="px-4"
                              type="text"
                              placeholder="Hours"
                              {...field}
                            />
                            <Clock2 className="absolute right-0   my-3 mr-4 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="date"
                    render={({ field }) => (
                      <FormItem className="w-full ">
                        <div className="leading-[14px] ">
                          <FormLabel>Date</FormLabel>
                          <sup className="text-destructive text-sm align-sub">
                            *
                          </sup>
                        </div>
                        <Popover open={isDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant={"outline"}
                              onClick={handleDatePickerState}
                              className={cn(
                                "w-full  justify-between text-left font-normal !mt-0  text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                field.value
                              ) : (
                                <span>{selectedDate}</span>
                              )}
                              <CalIcon />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={new Date(selectedDate)}
                              disableNavigation
                              disabled={
                                !isManager
                                  ? convertStringsToDates(
                                      leaveAndHolidayDates?.message
                                    )
                                  : []
                              }
                              onSelect={onDateSelect}
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
                    <FormItem className="flex flex-col pt-6">
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
                              className="max-w-full px-1 justify-between !mt-0 truncate"
                              disabled={state.timesheet.task ? true : false}
                            >
                              {field.value ? (
                                tasks?.message.find(
                                  (task: Task) => task.name === field.value
                                )?.subject
                              ) : (
                                <div className="flex justify-center items-center">
                                  <p className="ml-2 shrink-0 opacity-50">
                                    Search Task...
                                  </p>
                                </div>
                              )}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-96">
                          <Command>
                            <CommandInput placeholder="Search Tasks..." />
                            <CommandEmpty>No task found.</CommandEmpty>
                            <CommandGroup>
                              <CommandList>
                                {tasks?.message.map((task: Task) => (
                                  <CommandItem
                                    className="hover:cursor-pointer truncate aria-selected:bg-primary aria-selected:text-primary-forground"
                                    key={task.name}
                                    value={task.name}
                                    onSelect={onTaskSelect}
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
                    <FormItem className="flex flex-col pt-6">
                      <div>
                        <FormLabel>Comment</FormLabel>
                        <sup className="text-destructive text-sm align-sub">
                          *
                        </sup>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Explain your progress..."
                          {...field}
                          className="!mt-0"
                          rows={4}
                          required
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SheetFooter className="py-6 sm:justify-start gap-x-6">
                  <Button variant="accent" type="submit">
                    Add Time
                  </Button>
                  <Button variant="ghost" type="button" onClick={closeDialog}>
                    Cancel
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </div>
        </SheetContent>
      )}
    </Sheet>
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
