import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/app/components/ui/dialog";
import { RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { setDialog } from "@/store/team";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Button } from "@/app/components/ui/button";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { TimesheetSchema } from "@/schema/timesheet";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Typography } from "@/app/components/typography";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/app/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";
import { Clock3, Search } from "lucide-react";
import { DatePicker } from "@/app/components/datePicker";
import { getFormatedDate, parseFrappeErrorMsg } from "@/lib/utils";
import { ComboxBox } from "@/app/components/comboBox";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/components/ui/use-toast";
import { setFetchAgain } from "@/store/team";

export const AddTime = () => {
  const teamState = useSelector((state: RootState) => state.team);
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const { call } = useFrappePostCall("timesheet_enhancer.api.timesheet.save");
  const {toast} = useToast();
  const form = useForm<z.infer<typeof TimesheetSchema>>({
    resolver: zodResolver(TimesheetSchema),
    defaultValues: {
      name: teamState.timesheet.name,
      task: teamState.timesheet.task,
      hours: teamState.timesheet.hours.toString(),
      description: teamState.timesheet.description,
      date: teamState.timesheet.date,
      parent: teamState.timesheet.parent,
      is_update: teamState.timesheet.isUpdate,
      employee: teamState.employee,
    },
    mode: "onSubmit",
  });

  const { data: tasks, mutate: mutateTask } = useFrappeGetCall("timesheet_enhancer.api.utils.get_task_for_employee", {
    employee: form.getValues("employee"),
    search: searchTerm,
  });

  const handleOpenChange = () => {
    form.reset();
    dispatch(setDialog(false));
  };
  const handleTimeChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = event.target.value;
    form.setValue("hours", value);
  };
  const handleDateChange = (date: Date) => {
    form.setValue("date", getFormatedDate(date));
  };
  const handleTaskSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };
  const handleTaskChange = (value: string | string[]) => {
    if (value instanceof Array) {
      form.setValue("task", value[0]);
    } else {
      form.setValue("task", value);
    }
  };
  const handleSubmit = (data: z.infer<typeof TimesheetSchema>) => {
    call(data)
    .then((res) => {
      toast({
        variant: "success",
        description: res.message,
      });
      dispatch(setFetchAgain(true));
      handleOpenChange();
    })
    .catch((err) => {
      const error = parseFrappeErrorMsg(err);
      toast({
        variant: "destructive",
        description: error,
      });
    });
  };
  useEffect(() => {
    mutateTask();
  }, [searchTerm, mutateTask]);

  return (
    <Dialog open={teamState.isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle>Add Time</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="flex flex-col gap-y-4">
              <div className="flex gap-x-2">
                <FormField
                  control={form.control}
                  name="employee"
                  render={() => (
                    <FormItem className="w-full">
                      <FormLabel>Employee</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <EmployeeList employee={teamState.employee} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <Input
                            placeholder="0h"
                            className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                            {...field}
                            type="text"
                            onChange={handleTimeChange}
                          />
                          <Clock3 className="h-4 w-4 absolute right-0 m-3 top-0 stroke-slate-400" />
                        </div>
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
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DatePicker date={field.value} onDateChange={handleDateChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="task"
                render={() => (
                  <FormItem className="w-full">
                    <FormLabel>Tasks</FormLabel>
                    <FormControl>
                      <ComboxBox
                        label="Search Task"
                        value={form.getValues("task") ? [form.getValues("task")] : []}
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        //  @ts-expect-error
                        data={tasks?.message.map((item) => ({
                          label: item.subject,
                          value: item.name,
                          description: item.project_name,
                          disabled: false,
                        }))}
                        onSelect={handleTaskChange}
                        onSearch={handleTaskSearch}
                        rightIcon={<Search className="h-4 w-4 stroke-slate-400" />}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="w-full">
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

              <DialogFooter className="sm:justify-start">
                <Button>Add Time</Button>
                <Button type="button" variant="outline" onClick={handleOpenChange}>
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

type EmployeeListProps = {
  employee: string;
};
type EmployeeProps = {
  name: string;
  employee_name: string;
  image: string;
};
const EmployeeList = ({ employee }: EmployeeListProps) => {
  const { data, isLoading } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Employee",
    fields: ["name", "employee_name", "image"],
  });
  const [selectedEmployee, setSelectedEmployee] = useState<string>(employee);
  const handleSelectEmployee = (value: string) => {
    setSelectedEmployee(value);
  };
  if (isLoading) return <></>;
  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start gap-x-3 font-normal w-full truncate">
          {selectedEmployee ? (
            <>
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={data?.message.find((item: EmployeeProps) => item.name === selectedEmployee)?.image}
                  alt="image"
                />
                <AvatarFallback>
                  {data?.message.find((item: EmployeeProps) => item.name === selectedEmployee)?.employee_name[0]}
                </AvatarFallback>
              </Avatar>
              <Typography variant="p" className="truncate">
                {data?.message.find((item: EmployeeProps) => item.name === selectedEmployee)?.employee_name}
              </Typography>
            </>
          ) : (
            "select employee"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search Employee" />
          <CommandEmpty>No data.</CommandEmpty>
          {data?.message && (
            <CommandGroup>
              <CommandList>
                {data?.message.map((item: EmployeeProps, index: number) => {
                  const isActive = selectedEmployee == item.name;
                  return (
                    <CommandItem
                      key={index}
                      className="flex gap-x-2 text-primary font-normal"
                      value={item.name}
                      onSelect={handleSelectEmployee}
                    >
                      <Checkbox checked={isActive} />
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={item.image} alt={item.employee_name} />
                        <AvatarFallback>{item.employee_name[0]}</AvatarFallback>
                      </Avatar>
                      <Typography variant="p">{item.employee_name}</Typography>
                    </CommandItem>
                  );
                })}
              </CommandList>
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
