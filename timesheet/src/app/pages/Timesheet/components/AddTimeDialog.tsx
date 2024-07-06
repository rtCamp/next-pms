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
import { TimesheetSchema } from "@/app/schema";
import { Clock2, Calendar as CalIcon } from "@/app/components/Icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Typography } from "@/app/components/Typography";
import { Task } from "@/app/types/type";

export function AddTimeDialog({
  state,
  submitAction,
  closeAction,
}: {
  state: any;
  submitAction: () => void;
  closeAction: () => void;
}) {
  const employee = useSelector((state: RootState) => state.employee);
  const roles = useSelector((state: RootState) => state.roles);
  const isManager = roles.value.includes("Projects Manager");
  const [selectedDate, setSelectedDate] = useState<string>(
    getFormatedDate(new Date())
  );
  const [isOpen, setIsOpen] = useState(state.isDialogOpen);
  const [isComboOpen, setIsComboOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { toast } = useToast();
  const { call } = useFrappePostCall("timesheet_enhancer.api.timesheet.save");

  const form = useForm<z.infer<typeof TimesheetSchema>>({
    resolver: zodResolver(TimesheetSchema),
    defaultValues: {
      name: state.timesheet.name,
      task: state.timesheet.task,
      hours: state.timesheet.hours.toString(),
      description: state.timesheet.description,
      date: state.timesheet.date,
      parent: state.timesheet.parent,
      is_update: state.timesheet.isUpdate,
      employee: state.timesheet?.employee ?? "",
    },
    mode: "onBlur",
  });

  const {
    isLoading: isTaskLoading,
    data: tasks,
    error: taskError,
  } = useFrappeGetCall<{ message: [Task] }>(
    "timesheet_enhancer.api.utils.get_task_for_employee",
    {
      employee: employee.value,
    },
    "tasks",
    {
      shouldRetryOnError: false,
    }
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
    setIsOpen(false);
    closeAction();
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
  function onSubmit(values: z.infer<typeof TimesheetSchema>) {
    call(values)
      .then((res) => {
        closeDialog();
        submitAction();
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
  const onTaskSearch = (value: string, search: string) => {
    const item = tasks?.message?.find((item: Task) => item.name === value);
    if (!item) return 0;
    if (item.subject.toLowerCase().includes(search.toLowerCase())) return 1;

    return 0;
  };
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
                      <Popover
                        open={isComboOpen}
                        onOpenChange={setIsComboOpen}
                        modal={true}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="px-2  max-w-full  justify-between !mt-0 truncate"
                              disabled={state.timesheet.task ? true : false}
                            >
                              {field.value ? (
                                <Typography
                                  variant="p"
                                  className="sm:text-sm truncate "
                                >
                                  {
                                    tasks?.message.find(
                                      (task: Task) => task.name === field.value
                                    )?.subject
                                  }
                                </Typography>
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
                          <Command filter={onTaskSearch}>
                            <CommandInput placeholder="Search Tasks..." />
                            <ScrollArea>
                              <CommandEmpty>No task found.</CommandEmpty>
                              <CommandGroup>
                                <CommandList>
                                  {tasks?.message.map((task: Task) => (
                                    <CommandItem
                                      className="hover:cursor-pointer truncate"
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
                                      <Typography
                                        variant="p"
                                        className={`sm:text-sm truncate w-full ${
                                          task.status === "Completed"
                                            ? "text-muted-foreground/60"
                                            : ""
                                        }`}
                                      >
                                        {task.subject}
                                        <Typography
                                          variant="p"
                                          className="text-muted-foreground !text-[12px] truncate"
                                        >
                                          {task.project_name}
                                        </Typography>
                                      </Typography>
                                    </CommandItem>
                                  ))}
                                </CommandList>
                              </CommandGroup>
                            </ScrollArea>
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
                  <Button type="submit">Add Time</Button>
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
