import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/app/components/ui/dialog";
import { RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { setDialog } from "@/store/team";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { TimesheetSchema } from "@/schema/timesheet";
import { Typography } from "@/app/components/typography";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/app/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";
import { Clock3, Search, LoaderCircle } from "lucide-react";
import { DatePicker } from "@/app/components/datePicker";
import { getFormatedDate, parseFrappeErrorMsg, floatToTime } from "@/lib/utils";
import { ComboxBox } from "@/app/components/comboBox";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/components/ui/use-toast";
import { setFetchAgain } from "@/store/team";
import { Spinner } from "@/app/components/spinner";
import { DeleteConfirmation } from "@/app/pages/timesheet/addTime";

export const AddTime = () => {
  const teamState = useSelector((state: RootState) => state.team);
  const { call: deleteCall } = useFrappePostCall("timesheet_enhancer.api.timesheet.delete");
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState(teamState.timesheet.task??"");
  const { call } = useFrappePostCall("timesheet_enhancer.api.timesheet.save");
  const { toast } = useToast();
  const form = useForm<z.infer<typeof TimesheetSchema>>({
    resolver: zodResolver(TimesheetSchema),
    defaultValues: {
      name: teamState.timesheet.name,
      task: teamState.timesheet.task,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      hours: floatToTime(teamState.timesheet.hours),
      description: teamState.timesheet.description,
      date: teamState.timesheet.date,
      parent: teamState.timesheet.parent,
      is_update: teamState.timesheet.isUpdate,
      employee: teamState.employee,
    },
    mode: "onSubmit",
  });

  const {
    data: tasks,
    isLoading: taskLoading,
    mutate: mutateTask,
    error: taskError,
  } = useFrappeGetCall(
    "timesheet_enhancer.api.utils.get_task_for_employee",
    {
      search: searchTerm,
    },
    "task_for_an_employee",
    {
      shouldRetryOnError: false,
      errorRetryCount: 0,
      keepPreviousData: true,
    }
  );
  const {
    data: employeeDetail,
    isLoading: employeeDetailLoading,
    error: employeeDetailError,
  } = useFrappeGetCall("frappe.client.get_value", {
    doctype: "Employee",
    fieldname: ["name", "employee_name", "image"],
    filters: [["name", "=", teamState.employee]],
  });
  const handleOpenChange = () => {
    form.reset();
    dispatch(setDialog(false));
  };
  const handleTimeChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = event.target.value;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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
  useEffect(() => {
    if (taskError) {
      const err = parseFrappeErrorMsg(taskError);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    if (employeeDetailError) {
      const err = parseFrappeErrorMsg(employeeDetailError);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskError, employeeDetailError]);
  return (
    <Dialog open={teamState.isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle>Add Time</DialogTitle>
        {taskLoading || employeeDetailLoading ? (
          <Spinner />
        ) : (
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
                            <Button
                              variant="outline"
                              disabled
                              className="justify-start gap-x-3 font-normal w-full truncate"
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
                          disabled={teamState.timesheet.task.length > 0}
                          value={form.getValues("task") ? [form.getValues("task")] : []}
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          //  @ts-expect-error
                          data={tasks?.message.task.map((item) => ({
                            label: item.subject,
                            value: item.name,
                            description: item.project_name,
                            disabled: false,
                          }))}
                          showSelected
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
                  <div className="flex gap-x-4 w-full">
                    <Button disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <LoaderCircle className="animate-spin w-4 h-4" />}Add Time
                    </Button>
                    <Button type="button" variant="outline" onClick={handleOpenChange}>
                      Cancel
                    </Button>
                  </div>
                    {teamState.timesheet.hours>0 && <DeleteConfirmation onDelete={handleDelete} />}
                </DialogFooter>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
