import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { SetAddTimeDialog, SetFetchAgain } from "@/store/timesheet";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { DatePicker } from "@/app/components/datePicker";
import { ComboxBox } from "@/app/components/comboBox";
import { TimesheetSchema } from "@/schema/timesheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Clock3, Search } from "lucide-react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { getFormatedDate, parseFrappeErrorMsg } from "@/lib/utils";
import { useToast } from "@/app/components/ui/use-toast";
import { useEffect, useState } from "react";

export const AddTime = () => {
  const { call } = useFrappePostCall("timesheet_enhancer.api.timesheet.save");
  const timesheetState = useSelector((state: RootState) => state.timesheet);
  const [searchTerm, setSearchTerm] = useState("");

  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof TimesheetSchema>>({
    resolver: zodResolver(TimesheetSchema),
    defaultValues: {
      name: timesheetState.timesheet.name,
      task: timesheetState.timesheet.task,
      hours: timesheetState.timesheet.hours.toString(),
      description: timesheetState.timesheet.description,
      date: timesheetState.timesheet.date,
      parent: timesheetState.timesheet.parent,
      is_update: timesheetState.timesheet.isUpdate,
      employee: timesheetState.timesheet?.employee ?? user.employee,
    },
    mode: "onSubmit",
  });
  const { data: tasks, mutate: mutateTask } = useFrappeGetCall("timesheet_enhancer.api.utils.get_task_for_employee", {
    employee: form.getValues("employee"),
    search: searchTerm,
  });
  const handleOpen = () => {
    form.reset();
    dispatch(SetAddTimeDialog(false));
  };

  const handleDateChange = (date: Date) => {
    form.setValue("date", getFormatedDate(date));
  };

  const handleTaskChange = (value: string | string[]) => {
    if (value instanceof Array) {
      form.setValue("task", value[0]);
    } else {
      form.setValue("task", value);
    }
  };
  const handleTimeChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = event.target.value;
    form.setValue("hours", value);
  };
  const handleTaskSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };
  const handleSubmit = (data: z.infer<typeof TimesheetSchema>) => {
    call(data)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        dispatch(SetFetchAgain(true));
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

  useEffect(() => {
    mutateTask();
  }, [searchTerm, mutateTask]);
  return (
    <Dialog open={timesheetState.isDialogOpen} onOpenChange={handleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="pb-6">Add Time</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="flex flex-col gap-y-6">
              <div className="flex gap-x-4">
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
                <div className="flex gap-x-4">
                  <Button>Add Time</Button>
                  <Button variant="secondary" type="button" onClick={handleOpen}>
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
