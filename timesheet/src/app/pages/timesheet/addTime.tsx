import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
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
import { Clock3, Search, LoaderCircle, Trash2 } from "lucide-react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { getFormatedDate, parseFrappeErrorMsg, expectatedHours, floatToTime } from "@/lib/utils";
import { useToast } from "@/app/components/ui/use-toast";
import { useEffect, useMemo, useState } from "react";
import { Typography } from "@/app/components/typography";

export const AddTime = () => {
  const { call } = useFrappePostCall("timesheet_enhancer.api.timesheet.save");
  const { call: deleteCall } = useFrappePostCall("timesheet_enhancer.api.timesheet.delete");
  const timesheetState = useSelector((state: RootState) => state.timesheet);
  const [searchTerm, setSearchTerm] = useState(timesheetState.timesheet.task ?? "");
  const [selectedDate, setSelectedDate] = useState(getFormatedDate(timesheetState.timesheet.date));
  const userState = useSelector((state: RootState) => state.user);
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof TimesheetSchema>>({
    resolver: zodResolver(TimesheetSchema),
    defaultValues: {
      name: timesheetState.timesheet.name,
      task: timesheetState.timesheet.task,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      hours: floatToTime(timesheetState.timesheet.hours),
      description: timesheetState.timesheet.description,
      date: timesheetState.timesheet.date,
      parent: timesheetState.timesheet.parent,
      is_update: timesheetState.timesheet.isUpdate,
      employee: timesheetState.timesheet?.employee ?? user.employee,
    },
    mode: "onSubmit",
  });

  const {
    data: tasks,
    mutate: mutateTask,
    error: errorTask,
  } = useFrappeGetCall(
    "timesheet_enhancer.api.utils.get_task_for_employee",
    {
      employee: form.getValues("employee"),
      search: searchTerm,
    },
    "task_for_employee",
    {
      errorRetryCount: 1,
    }
  );

  const { data: perDayEmpHours, mutate: mutatePerDayHrs } = useFrappeGetCall(
    "timesheet_enhancer.api.timesheet.get_remaining_hour_for_employee",
    {
      employee: userState.employee,
      date: selectedDate,
    }
  );
  useEffect(() => {
    if (errorTask) {
      const error = parseFrappeErrorMsg(errorTask);
      toast({
        variant: "destructive",
        description: error,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorTask]);
  const handleOpen = () => {
    form.reset();
    dispatch(SetAddTimeDialog(false));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    form.setValue("date", getFormatedDate(date));
    setSelectedDate(getFormatedDate(date));
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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
  const handleDelete = () => {
    const data = {
      name: form.getValues("name"),
      parent: form.getValues("parent"),
    };
    deleteCall(data)
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
  useEffect(() => {
    mutatePerDayHrs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);
  const expected_Hour_of_emp = useMemo(() => {
    return expectatedHours(timesheetState.data.working_hour, timesheetState.data.working_frequency);
  }, []);
  return (
    <Dialog open={timesheetState.isDialogOpen} onOpenChange={handleOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="pb-6">{timesheetState.timesheet.hours > 0 ? "Edit Time" : "Add Time"}</DialogTitle>
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
                        <>
                          <div className="relative flex items-center">
                            <Input
                              placeholder="00:00"
                              className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                              type="text"
                              onChange={handleTimeChange}
                            />
                            <Clock3 className="h-4 w-4 absolute right-0 m-3 top-0 stroke-slate-400" />
                          </div>
                          {/* Task: Remaining hours indicator */}
                          {perDayEmpHours && (
                            <div className="flex gap-x-4">
                              <div className="flex gap-1 justify-center items-center">
                                <Typography
                                  variant="p"
                                  className={`${
                                    Number(perDayEmpHours?.message) < expected_Hour_of_emp
                                      ? "text-success"
                                      : "text-destructive"
                                  }`}
                                >
                                  {`${floatToTime(Math.abs(expected_Hour_of_emp - Number(perDayEmpHours?.message)))} hrs ${
                                    expected_Hour_of_emp - Number(perDayEmpHours?.message) >= 0
                                      ? "remaining"
                                      : "extended"
                                  }`}
                                </Typography>
                              </div>
                            </div>
                          )}
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
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onDateChange={handleDateChange}
                          disabled={timesheetState.timesheet.task.length > 0}
                        />
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
                  <FormItem>
                    <FormLabel>Tasks</FormLabel>
                    <FormControl>
                      <ComboxBox
                        label="Search Task"
                        showSelected
                        disabled={timesheetState.timesheet.task.length > 0}
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

              <DialogFooter className="sm:justify-start w-full">
                <div className="flex gap-x-4 w-full">
                  <Button disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <LoaderCircle className="animate-spin w-4 h-4" />}
                    {timesheetState.timesheet.hours > 0 ? "Edit Time" : "Add Time"}
                  </Button>
                  <Button variant="secondary" type="button" onClick={handleOpen}>
                    Cancel
                  </Button>
                </div>
                {timesheetState.timesheet.hours > 0 && <DeleteConfirmation onDelete={handleDelete} />}
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const DeleteConfirmation = ({ onDelete }: { onDelete: () => void }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" className="float-right gap-x-1" type="button">
          <Trash2 className="h-4 w-4 stroke-white" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Time</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-y-4">
          <Typography variant="p">Are you sure you want to delete this time entry?</Typography>
          <div className="flex gap-x-4">
            <Button variant="destructive" className="float-right px-2 gap-x-1" type="button" onClick={onDelete}>
              <Trash2 className="h-4 w-4 stroke-white" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
