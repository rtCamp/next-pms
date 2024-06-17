import { RootState } from "@/app/state/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScreenLoader } from "@/app/components/Loader";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/app/components/Typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Clock2, Calendar as CalIcon } from "@/app/components/Icon";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";

import {
  setDialogInput,
  setIsAddTimeDialogOpen,
} from "@/app/state/employeeList";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { z } from "zod";

import { useForm } from "react-hook-form";
import { cn, getFormatedDate } from "@/app/lib/utils";

interface EmployeeProps {
  name: string;
  employee_name: string;
  image: string;
}
interface Task {
  name: string;
  subject: string;
}
export function AddTimeDialog() {
  const state = useSelector((state: RootState) => state.employeeList);
  const dialogInput = state.dialogInput;
  const [isOpen, setIsOpen] = useState(state.isAddTimeDialogOpen);
  const [isEmployeeBoxOpen, setIsEmployeeBoxOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTaskBoxOpen, setIsTaskBoxOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    getFormatedDate(new Date())
  );
  const dispatch = useDispatch();

  const FormSchema = z.object({
    task: z.string({
      required_error: "Please select a task.",
    }),
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
    is_update: z.boolean({}),
    employee: z.string({
      required_error: "Please select an employee.",
    }),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      task: dialogInput.task,
      hours: dialogInput.hours,
      description: dialogInput.description,
      date: dialogInput.date,
      employee: dialogInput.employee,
      is_update: dialogInput.is_update,
    },
    mode: "onBlur",
  });
  const { data: employees, isLoading } = useFrappeGetCall(
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

  const { data: tasks, isLoading: isTaskLoading } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Task",
      fields: ["name", "subject"],
    },
    "tasks"
  );
  useEffect(() => {
    const date = getFormatedDate(dialogInput.date);
    setSelectedDate(date);
  }, []);
  const closeDialog = () => {
    const data = {
      isNew: false,
      employee: "",
      task: "",
      hours: "",
      description: "",
      date: "",
      is_update: false,
    };
    dispatch(setDialogInput(data));
    setIsOpen(false);
    setTimeout(() => {
      dispatch(setIsAddTimeDialogOpen(false));
    }, 500);
  };
  const onEmployeeSelect = (employee: string) => {
    form.setValue("employee", employee);
    setIsEmployeeBoxOpen(false);
  };
  const onDateSelect = (
    day: Date | undefined,
    selectedDay: Date,
    activeModifiers: any,
    e: React.MouseEvent<Element, globalThis.MouseEvent>
  ) => {
    if (!day) return;
    const formatedDate = getFormatedDate(day);
    setSelectedDate(formatedDate);
    form.setValue("date", formatedDate);
    setIsDatePickerOpen(false);
  };
  const onTaskSelect = (task: string) => {
    form.setValue("task", task);
    setIsTaskBoxOpen(false);
  };
  const onSubmit = (values: z.infer<typeof FormSchema>) => {
    console.log(values);
  };
  return (
    <Sheet open={isOpen} onOpenChange={closeDialog}>
      <SheetContent className="sm:max-w-xl px-11 py-6">
        {isLoading || isTaskLoading ? (
          <ScreenLoader />
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="font-bold">Add Time</SheetTitle>
            </SheetHeader>
            <Separator className="my-6" />
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex gap-x-2 flex-wrap sm:flex-nowrap ">
                  <div className="w-full sm:w-5/12">
                    <FormField
                      name="employee"
                      render={({ field }) => (
                        <FormItem className="flex flex-col ">
                          <FormLabel>
                            Member
                            <sup className="text-destructive text-sm align-sub">
                              *
                            </sup>
                          </FormLabel>
                          <Popover
                            open={isEmployeeBoxOpen}
                            onOpenChange={setIsEmployeeBoxOpen}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="max-w-full px-2 py-4 justify-between gap-x-2 !mt-0 truncate "
                                >
                                  {field.value ? (
                                    <>
                                      <Avatar className="h-[24px] w-[24px]">
                                        <AvatarFallback>
                                          {
                                            employees.message.find(
                                              (employee: EmployeeProps) =>
                                                employee.name === field.value
                                            )?.employee_name[0]
                                          }
                                        </AvatarFallback>
                                        <AvatarImage
                                          src={decodeURIComponent(
                                            employees.message.find(
                                              (employee: EmployeeProps) =>
                                                employee.name === field.value
                                            )?.image
                                          )}
                                          alt="Employee Image"
                                        />
                                      </Avatar>
                                      <Typography
                                        variant="p"
                                        className="sm:text-sm"
                                      >
                                        {
                                          employees.message.find(
                                            (employee: EmployeeProps) =>
                                              employee.name === field.value
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
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-96">
                              <Command>
                                <CommandInput placeholder="Search Employee..." />
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
                                              field.value === employee.name
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
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex gap-x-2  pt-4 sm:pt-0">
                    <FormField
                      name="hours"
                      render={({ field }) => (
                        <FormItem className="flex flex-col w-6/12">
                          <FormLabel>
                            Time
                            <sup className="text-destructive text-sm align-sub">
                              *
                            </sup>
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
                            <sup className="text-destructive text-sm align-sub">
                              *
                            </sup>
                          </FormLabel>
                          <Popover
                            open={isDatePickerOpen}
                            onOpenChange={setIsDatePickerOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant={"outline"}
                                className={cn(
                                  "w-full  justify-between text-left font-normal !mt-0  text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  field.value
                                ) : (
                                  <span>{selectedDate}</span>
                                )}
                                <CalIcon stroke="#AB3A6C" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                disableNavigation
                                selected={new Date(selectedDate)}
                                onSelect={onDateSelect}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormField
                  name="task"
                  render={({ field }) => (
                    <FormItem className="flex flex-col w-full pt-6">
                      <FormLabel>
                        Tasks
                        <sup className="text-destructive text-sm align-sub">
                          *
                        </sup>
                      </FormLabel>
                      <Popover
                        open={isTaskBoxOpen}
                        onOpenChange={setIsTaskBoxOpen}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="max-w-full px-2 justify-between !mt-0"
                            >
                              {field.value ? (
                                <Typography variant="p" className="sm:text-sm truncate">
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
                    <FormItem className="flex flex-col w-full pt-6">
                      <FormLabel>
                        Comment
                        <sup className="text-destructive text-sm align-sub">
                          *
                        </sup>
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
                  <Button variant="ghost" type="button" onClick={closeDialog}>
                    Cancel
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
