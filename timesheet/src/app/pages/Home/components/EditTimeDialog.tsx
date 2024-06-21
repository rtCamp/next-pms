import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { reducer, initialState } from "@/app/reducer/home/edittime";
import { useEffect, useReducer, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { cn, getFormatedDate, parseFrappeErrorMsg } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Typography } from "@/app/components/Typography";
import { Task, EmployeeProps } from "@/app/types/type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar as CalIcon, Clock2, Trash } from "@/app/components/Icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandItem,
  Command,
} from "@/components/ui/command";
import { ChevronDown, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash";
import { TimesheetSchema } from "@/app/schema";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
interface timesheetProps {
  project_name: string;
  department: string;
  name: string;
  project: string;
  hours: number;
  task_subject: string;
  task_name: string;
  parent: string;
  description: string;
}
export function EditTimeDialog({
  state,
  closeAction,
}: {
  state: any;
  closeAction: () => void;
}) {
  const { call: saveTime } = useFrappePostCall(
    "timesheet_enhancer.api.timesheet.save"
  );
  const { call: deleteTime } = useFrappePostCall(
    "timesheet_enhancer.api.timesheet.delete"
  );
  const { call: getTimesheet } = useFrappePostCall(
    "timesheet_enhancer.api.timesheet.get_timesheet_detail_for_employee"
  );
  const [localState, localDispatch] = useReducer(reducer, initialState);
  const { toast } = useToast();
  const [isHoverOpen, setIsHoverOpen] = useState(false);

  function fetch(employee: string, date: string) {
    if (!employee || !date) return;
    getTimesheet({
      employee: employee,
      date: date,
    })
      .then((res) => {
        localDispatch({ type: "setData", payload: res.message });
      })
      .catch((err) => {
        const errorMsg = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          title: errorMsg,
        });
        localDispatch({ type: "setData", payload: [] });
      });
  }
  useEffect(() => {
    const date = getFormatedDate(state.dialogInput.date);
    localDispatch({ type: "setSelectedDate", payload: date });
    localDispatch({ type: "setDialogInput", payload: state.dialogInput });
    localDispatch({ type: "setIsOpen", payload: state.isEditTimeDialogOpen });
  }, []);
  useEffect(() => {
    fetch(localState.dialogInput.employee, localState.dialogInput.date);
  }, [localState.isOpen]);

  const { data: employees, isLoading: isEmployeeLoading } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Employee",
      fields: ["name", "employee_name", "image"],
      filters: {
        status: "Active",
      },
    },
    "employees"
  );

  useEffect(() => {
    fetch(localState.dialogInput.employee, localState.dialogInput.date);
  }, [localState.dialogInput.employee, localState.dialogInput.date]);

  const onEmployeeSelect = (employee: string) => {
    localDispatch({
      type: "setDialogInput",
      payload: { ...localState.dialogInput, employee: employee },
    });
    localDispatch({ type: "setIsEmployeeBoxOpen", payload: false });
  };
  const onDateSelect = (
    day: Date | undefined,
    selectedDay: Date,
    activeModifiers: any,
    e: React.MouseEvent<Element, globalThis.MouseEvent>
  ) => {
    const formatedDate = getFormatedDate(day ?? new Date());
    localDispatch({ type: "setSelectedDate", payload: formatedDate });
    localDispatch({ type: "setIsDatePickerOpen", payload: false });
  };
  const onDeleteTime = (parent: string, name: string) => {
    deleteTime({ parent: parent, name: name })
      .then((res) => {
        toast({
          variant: "success",
          title: res.message,
        });
        fetch(localState.dialogInput.employee, localState.dialogInput.date);
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          title: error,
        });
      });
  };
  const onTaskTimeChange = debounce(
    (
      parent: string,
      name: string,
      hour: string,
      description: string,
      task: string
    ) => {
      if (!hour) return;
      const data = {
        date: localState.dialogInput.date,
        employee: localState.dialogInput.employee,
        description: description,
        hours: hour,
        parent: parent,
        name: name,
        task: task,
        is_update: true,
      };
      saveTime(data)
        .then((res) => {
          toast({
            variant: "success",
            title: res.message,
          });
        })
        .catch((err) => {
          const error = parseFrappeErrorMsg(err);
          toast({
            variant: "destructive",
            title: error,
          });
        });
    },
    1000
  );
  const closeDialog = () => {
    if (localState.isAdd) {
      localDispatch({ type: "setIsAdd", payload: false });
    } else {
      localDispatch({ type: "setIsOpen", payload: false });
      closeAction();
    }
  };
  const openAddTimeDialog = () => {
    localDispatch({ type: "setIsAdd", payload: true });
  };
  return (
    <Sheet open={localState.isOpen} onOpenChange={closeDialog}>
      <SheetContent
        className={`${
          localState.isAdd ? "sm:max-w-[1334px]" : "sm:max-w-[676px]"
        } transition-all duration-500 ease-in-out px-11 py-6`}
      >
        {isEmployeeLoading || !localState.data ? (
          <></>
        ) : (
          <div className="flex  gap-x-6">
            <div className={` ${localState.isAdd ? "w-6/12" : "w-full"} `}>
              <SheetHeader>
                <SheetTitle className="font-bold">Edit Time</SheetTitle>
              </SheetHeader>
              <Separator className="my-6" />
              <div className="flex gap-x-2 flex-wrap sm:flex-nowrap ">
                <div className="w-full sm:w-6/12">
                  <Popover
                    open={localState.isEmployeeBoxOpen}
                    onOpenChange={() =>
                      localDispatch({
                        type: "setIsEmployeeBoxOpen",
                        payload: !localState.isEmployeeBoxOpen,
                      })
                    }
                    modal={true}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full px-2 py-4 justify-between  !mt-0 truncate "
                      >
                        <div className="flex items-center gap-x-2">
                          {state.dialogInput.employee ? (
                            <>
                              <Avatar className="h-[24px] w-[24px]">
                                <AvatarFallback>
                                  {
                                    employees.message.find(
                                      (employee: EmployeeProps) =>
                                        employee.name ===
                                        localState.dialogInput.employee
                                    )?.employee_name[0]
                                  }
                                </AvatarFallback>
                                <AvatarImage
                                  src={decodeURIComponent(
                                    employees.message.find(
                                      (employee: EmployeeProps) =>
                                        employee.name ===
                                        localState.dialogInput.employee
                                    )?.image
                                  )}
                                  alt="Employee Image"
                                />
                              </Avatar>
                              <Typography variant="p" className="sm:text-sm">
                                {
                                  employees.message.find(
                                    (employee: EmployeeProps) =>
                                      employee.name ===
                                      localState.dialogInput.employee
                                  )?.employee_name
                                }
                              </Typography>
                            </>
                          ) : (
                            <div className="flex justify-center items-center">
                              <p className="ml-2 shrink-0 opacity-50">
                                Search Employee...
                              </p>
                            </div>
                          )}
                        </div>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96">
                      <Command>
                        <CommandInput placeholder="Search Employee..." />
                        <ScrollArea>
                          <CommandEmpty>No employee found.</CommandEmpty>
                          <CommandGroup>
                            <CommandList>
                              {employees.message.map(
                                (employee: EmployeeProps) => (
                                  <CommandItem
                                    className="hover:cursor-pointer truncate aria-selected:bg-primary aria-selected:text-primary-forground"
                                    key={employee.name}
                                    value={employee.name}
                                    onSelect={onEmployeeSelect}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        localState.dialogInput.employee ===
                                          employee.name
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex gap-x-3">
                                      <Avatar className="h-[24px] w-[24px]">
                                        <AvatarFallback>
                                          {employee.employee_name[0]}
                                        </AvatarFallback>
                                        <AvatarImage
                                          src={decodeURIComponent(
                                            employee.image
                                          )}
                                          alt="Employee Image"
                                        />
                                      </Avatar>
                                      <Typography
                                        variant="p"
                                        className="sm:text-sm"
                                      >
                                        {employee.employee_name}
                                      </Typography>
                                    </div>
                                  </CommandItem>
                                )
                              )}
                            </CommandList>
                          </CommandGroup>
                        </ScrollArea>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-x-2 w-6/12">
                  <Popover
                    open={localState.isDatePickerOpen}
                    onOpenChange={() =>
                      localDispatch({
                        type: "setIsDatePickerOpen",
                        payload: !localState.isDatePickerOpen,
                      })
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-full  justify-between text-left font-normal !mt-0  text-muted-foreground"
                        )}
                      >
                        <span>{localState.dialogInput.date}</span>
                        <CalIcon stroke="#AB3A6C" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        disableNavigation
                        selected={new Date(localState.dialogInput.date)}
                        onSelect={onDateSelect}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="accent"
                    onClick={openAddTimeDialog}
                    disabled={localState.isAdd}
                  >
                    Add Time
                  </Button>
                </div>
              </div>
              <Table className="my-6">
                <TableHeader className="[&_th]:p-2">
                  <TableRow className="bg-primary">
                    <TableHead>Time</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>
                      <Trash />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-primary [&_td]:p-2">
                  {localState?.data?.map((item: timesheetProps) => {
                    return (
                      <TableRow>
                        <TableCell>
                          <div className="bg-background flex items-center rounded-md justify-around">
                            <TimeInput
                              data={item}
                              callback={onTaskTimeChange}
                            />
                            <ChevronDown size={16} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="p"
                            className="truncate max-w-72 sm:text-sm"
                          >
                            {item.task_subject}
                          </Typography>
                          <Typography
                            variant="p"
                            className="text-muted-foreground truncate !text-[13px]"
                          >
                            {item.project_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="p"
                            className="truncate sm:text-sm"
                          >
                            {item.department}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <HoverCard
                            open={isHoverOpen}
                            onOpenChange={setIsHoverOpen}
                          >
                            <HoverCardTrigger
                              onMouseEnter={() => setIsHoverOpen}
                            >
                              <Trash className="hover:cursor-pointer" />
                            </HoverCardTrigger>
                            <HoverCardContent className="w-54 mr-10">
                              <Typography
                                variant="small"
                                className="!font-bold"
                              >
                                Do you want to delete this entry?
                              </Typography>
                              <div className="flex gap-4 pt-4">
                                <Button
                                  variant="accent"
                                  onClick={() =>
                                    onDeleteTime(item.parent, item.name)
                                  }
                                >
                                  Yes
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => setIsHoverOpen(false)}
                                >
                                  Cancel{" "}
                                </Button>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {localState.isAdd && (
              <div className={` ${localState.isAdd ? "w-6/12" : ""} `}>
                <AddTime
                  employee={localState.dialogInput.employee}
                  date={localState.dialogInput.date}
                  onClose={closeDialog}
                  fetch={fetch}
                />
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TimeInput({
  data,
  callback,
}: {
  data: timesheetProps;
  callback: any;
}) {
  const [hour, setHour] = useState(data.hours);
  const onHourChange = (e: any) => {
    setHour(e.target.value);
    callback &&
      callback(
        data.parent,
        data.name,
        e.target.value,
        data.description,
        data.task_name
      );
  };
  return (
    <Input
      className="border-none max-w-14 px-1  focus-visible:ring-0 focus-visible:ring-offset-0"
      value={hour}
      onChange={onHourChange}
    />
  );
}

function AddTime({
  employee,
  date,
  onClose,
  fetch,
}: {
  employee: string;
  date: string;
  onClose?: () => void;
  fetch: (employee: string, date: string) => void;
}) {
  const { call } = useFrappePostCall("timesheet_enhancer.api.timesheet.save");
  const { toast } = useToast();
  const {
    data: tasks,
    isLoading: isTaskLoading,
    mutate,
  } = useFrappeGetCall(
    "timesheet_enhancer.api.utils.get_task_for_employee",
    {
      employee: employee,
    },
    "tasks"
  );
  useEffect(() => {
    if (!employee) return;
    mutate();
  }, [employee]);

  const form = useForm<z.infer<typeof TimesheetSchema>>({
    resolver: zodResolver(TimesheetSchema),
    defaultValues: {
      name: "",
      task: "",
      hours: "",
      description: "",
      date: date,
      parent: "",
      is_update: false,
      employee: employee,
    },
    mode: "onBlur",
  });
  const onTaskSearch = (value: string, search: string) => {
    const item = tasks?.message?.find((item: Task) => item.name === value);
    if (!item) return 0;
    if (item.subject.toLowerCase().includes(search.toLowerCase())) return 1;

    return 0;
  };

  const onSubmit = (values: z.infer<typeof TimesheetSchema>) => {
    call(values)
      .then((res) => {
        toast({
          variant: "success",
          title: res.message,
        });
        if (
          form.getValues("employee") == employee &&
          form.getValues("date") == date
        ) {
          fetch(employee, date);
        }
        form.reset();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          title: error,
        });
      });
  };
  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-bold">Add Time</SheetTitle>
      </SheetHeader>
      <Separator className="my-6" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex gap-x-2 flex-wrap sm:flex-nowrap w-full ">
            <FormField
              name="hours"
              render={({ field }) => (
                <FormItem className="flex flex-col w-6/12">
                  <FormLabel>
                    Time
                    <sup className="text-destructive text-sm align-sub">*</sup>
                  </FormLabel>
                  <FormControl>
                    <div className="flex justify-between gap-1 !mt-0 relative w-full">
                      <Input
                        className="px-4"
                        type="text"
                        placeholder="Hours"
                        {...field}
                      />
                      <Clock2
                        className="absolute right-0   my-3 mr-4 h-4 w-4 text-accent"
                        stroke="#AB3A6C"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col w-6/12">
                  <FormLabel>
                    Date
                    <sup className="text-destructive text-sm align-sub">*</sup>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-full  justify-between text-left font-normal !mt-0  text-muted-foreground"
                        )}
                      >
                        <span>{field.value}</span>

                        <CalIcon stroke="#AB3A6C" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        disableNavigation
                        selected={new Date(field.value)}
                        onSelect={(date) => {
                          const formatedDate = getFormatedDate(
                            date ?? new Date()
                          );
                          form.setValue("date", formatedDate);
                        }}
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
              <FormItem className="flex flex-col w-full pt-6">
                <FormLabel>
                  Tasks
                  <sup className="text-destructive text-sm align-sub">*</sup>
                </FormLabel>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="px-2 justify-between !mt-0"
                      >
                        {field.value ? (
                          <Typography
                            variant="p"
                            className="sm:text-sm truncate"
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

                      <CommandEmpty>No task found.</CommandEmpty>
                      <CommandGroup>
                        <CommandList>
                          {tasks?.message?.map((task: Task) => (
                            <CommandItem
                              className="hover:cursor-pointer aria-selected:bg-primary aria-selected:text-primary-forground"
                              key={task.name}
                              value={task.name}
                              onSelect={(task) => {
                                field.onChange(task);
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
              <FormItem className="flex flex-col w-full pt-6">
                <FormLabel>
                  Comment
                  <sup className="text-destructive text-sm align-sub">*</sup>
                </FormLabel>
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
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
          </SheetFooter>
        </form>
      </Form>
    </>
  );
}
