import { useForm } from "react-hook-form";
import {
  Dialog,
  CustomDialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { TimesheetProp } from "@/app/types/timesheet";
import { ScreenLoader } from "@/app/components/Loader";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

interface Task {
  name: string;
  subject: string;
}
export default function TimesheetDialog({
  isOpen,
  timesheet,
  closeDialog,
  setFetchAgain,
}: {
  isOpen: boolean;
  timesheet: TimesheetProp;
  closeDialog: () => void;
  setFetchAgain: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [isComboOpen, setIsComboOpen] = useState(false);
  const { call } = useFrappePostCall("timesheet_enhancer.api.timesheet.save");
  const FormSchema = z.object({
    task: z.string({
      required_error: "Please select a task.",
    }),
    name: z.string({}),
    hours: z.number({
      required_error: "Please enter hours.",
    }),
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
      name: timesheet.name,
      task: timesheet.task,
      hours: timesheet.hours,
      description: timesheet.description,
      date: timesheet.date,
      parent: timesheet.parent,
      is_update: timesheet.isUpdate,
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
  if (isLoading) {
    return <ScreenLoader isFullPage={false} />;
  }

  function onSubmit(values: z.infer<typeof FormSchema>) {
    call(values)
      .then((res) => {
        if (res.message) {
          closeDialog();
          setFetchAgain(true);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  return (
    <Dialog open={isOpen}>
      <CustomDialogContent
        className="sm:max-w-md timesheet-dialog"
        isCloseButton={true}
        closeAction={closeDialog}
      >
        <DialogHeader>
          <DialogTitle>Add Time</DialogTitle>
        </DialogHeader>
        <div>
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
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
                            className="max-w-max"
                            disabled={timesheet.task ? true : false}
                          >
                            {field.value
                              ? tasks?.message.find(
                                  (task: Task) => task.name === field.value
                                )?.subject
                              : "Select Task"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Command>
                          <CommandInput placeholder="Search framework..." />
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
                        <Input
                          className="w-auto "
                          type="number"
                          placeholder="Hours"
                          defaultValue={timesheet.hours}
                          min={0}
                          max={8}
                          onChange={(event) => {
                            field.onChange(parseInt(event.target.value));
                          }}
                        />
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
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              const d = date?.toLocaleDateString("sv-SE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              });

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
                        placeholder="Add task description"
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
