import { useToast } from "@/app/components/ui/use-toast";
import { RootState } from "@/store";
import { useSelector, useDispatch } from "react-redux";
import { setDateRange, setFetchAgain } from "@/store/team";
import { Button } from "@/app/components/ui/button";
import { calculateExtendedWorkingHour, cn, getDateFromDateAndTime, parseFrappeErrorMsg, prettyDate } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useFrappeGetCall, useFrappePostCall, useFrappeGetDocList } from "frappe-react-sdk";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/app/components/ui/sheet";
import { Spinner } from "@/app/components/spinner";
import { NewTimesheetProps, TaskDataItemProps, timesheet } from "@/types/timesheet";
import { Typography } from "@/app/components/typography";
import { WorkingFrequency } from "@/types";
import { TimeInput } from "@/app/pages/team/employeeDetail";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Separator } from "@/app/components/ui/separator";
import { Check, X } from "lucide-react";
import { Textarea } from "@/app/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { TimesheetRejectionSchema } from "@/schema/timesheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";

export const Approval = () => {
  const { toast } = useToast();
  const teamState = useSelector((state: RootState) => state.team);
  const [timesheetData, setTimesheetData] = useState<timesheet>();
  const [working_hour, setWorkingHour] = useState<number>(0);
  const [working_frequency, setWorkingFrequency] = useState<WorkingFrequency>("Per Day");
  const [daySelectionRequired, setDaySelectionRequired] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const dispatch = useDispatch();

  const { call } = useFrappePostCall("timesheet_enhancer.api.team.update_timesheet_status");
  const { call: updateTime } = useFrappePostCall("timesheet_enhancer.api.timesheet.save");
  const { data: timesheetList, isLoading: isTimesheetListLoading } = useFrappeGetDocList("Timesheet", {
    fields: ["docstatus", "start_date"],
    filters: [
      ["start_date", ">=", teamState.dateRange.start_date],
      ["start_date", "<=", teamState.dateRange.end_date],
      ["employee", "=", teamState.employee],
    ],
  });
  const handleTimeChange = (value: NewTimesheetProps) => {
    updateTime(value)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        mutate();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };
  const { data, isLoading, error, mutate } = useFrappeGetCall("timesheet_enhancer.api.timesheet.get_timesheet_data", {
    employee: teamState.employee,
    start_date: teamState.weekDate,
    max_week: 1,
  });
  const handleOpen = () => {
    const data = { start_date: "", end_date: "" };
    dispatch(setFetchAgain(true));
    dispatch(setDateRange({ dateRange: data, employee: "", isAprrovalDialogOpen: false }));
  };
  const handleApproval = () => {
    const data = {
      dates: selectedDates,
      status: "Approved",
      employee: teamState.employee,
    };
    call(data)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
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
  const handleRejection = (reason: string) => {
    const data = {
      dates: selectedDates,
      status: "Rejected",
      employee: teamState.employee,
      note: reason,
    };
    call(data)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
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
  const handleCheckboxChange = (date: string) => {
    setSelectedDates((prevSelectedDates) =>
      prevSelectedDates.includes(date) ? prevSelectedDates.filter((d) => d !== date) : [...prevSelectedDates, date]
    );
  };
  useEffect(() => {
    if (data) {
      setTimesheetData(data.message.data[Object.keys(data.message.data)[0]]);
      setWorkingHour(data.message.working_hour);
      setWorkingFrequency(data.message.working_frequency);
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error]);
  useEffect(() => {
    if (timesheetData && timesheetList) {
      const validDates = timesheetList.filter((dateObj) => dateObj.docstatus == 1).map((dateObj) => dateObj.start_date);
      const filteredDates = timesheetData.dates.filter((date) => !validDates.includes(date));
      setSelectedDates(filteredDates ?? []);
    }
  }, [timesheetData, timesheetList]);

  return (
    <Sheet open={teamState.isAprrovalDialogOpen} onOpenChange={handleOpen} modal={true}>
      {(isLoading || isTimesheetListLoading) && <Spinner />}
      {timesheetData && (
        <SheetContent className="sm:max-w-4xl overflow-auto">
          <SheetHeader>
            <SheetTitle>
              Week of {prettyDate(teamState.dateRange.start_date).date} -{prettyDate(teamState.dateRange.end_date).date}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-y-4 mt-6">
            <div>
              {timesheetData.dates.map((date: string, index: number) => {
                const { date: formattedDate, day } = prettyDate(date, true);
                const matchingTasks = Object.entries(timesheetData.tasks).flatMap(
                  ([taskName, task]: [string, TaskDataItemProps]) =>
                    task.data
                      .filter((taskItem: TaskDataItemProps[]) => getDateFromDateAndTime(taskItem.from_time) === date)
                      .map((taskItem: TaskDataItemProps) => ({
                        ...taskItem,
                        taskName,
                        projectName: task.project_name,
                      }))
                );
                const totalHours = matchingTasks.reduce((sum, task) => sum + task.hours, 0);
                const isExtended = calculateExtendedWorkingHour(totalHours, working_hour, working_frequency);

                return (
                  <div key={index} className="flex flex-col ">
                    <div className="bg-gray-100 p-2 py-3 border-b flex gap-x-4">
                      <Typography
                        variant="p"
                        className={cn(
                          "border px-1 rounded",
                          isExtended == 0 && "border-destructive",
                          isExtended && "border-success",
                          isExtended == 2 && "border-warning"
                        )}
                      >
                        {totalHours}h
                      </Typography>
                      <Typography variant="p">
                        {day.toUpperCase()} {formattedDate}
                      </Typography>
                    </div>
                    {matchingTasks?.map((task: TaskDataItemProps, index: number) => {
                      const data = {
                        name: task.name,
                        parent: task.parent,
                        task: task.task,
                        date: getDateFromDateAndTime(task.from_time),
                        description: task.description,
                        hours: task.hours,
                        isUpdate: task.hours > 0 ? true : false,
                      };
                      return (
                        <div className="flex gap-x-4 items-center px-4 py-2 border-b last:border-b-0" key={index}>
                          <TimeInput
                            disabled={task.docstatus == 1}
                            data={data}
                            callback={handleTimeChange}
                            employee={teamState.employee}
                          />
                          <div className="flex justify-between w-full">
                            <div className="flex flex-col gap-y-2 w-full">
                              <Typography variant="p" className="font-bold">
                                {task.taskName}
                              </Typography>
                              <Typography variant="p">{task.description}</Typography>
                            </div>
                            <Typography
                              variant="p"
                              className="w-full max-w-xs float-right flex justify-end items-center"
                            >
                              {task.projectName}
                            </Typography>
                          </div>
                        </div>
                      );
                    })}
                    {matchingTasks.length == 0 && (
                      <Typography variant="p" className="text-center p-3">
                        No data.
                      </Typography>
                    )}
                  </div>
                );
              })}
            </div>
            <Separator />
            <div className="flex gap-x-2 items-center">
              <Checkbox
                checked={daySelectionRequired}
                onCheckedChange={(checked: boolean) => {
                  setDaySelectionRequired(checked);
                }}
              />
              <Typography variant="p">Select days to approve</Typography>
            </div>
            <div className="flex gap-x-2">
              {timesheetData.dates.map((date: string) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { date: formattedDate, day } = prettyDate(date, false);
                const isChecked = selectedDates.includes(date);
                const isDisabledAndGreen = timesheetList?.some(
                  (timesheet) => timesheet.start_date === date && timesheet.docstatus === 1
                );

                return (
                  <div className="flex items-center gap-x-1">
                    <Checkbox
                      checked={isChecked || isDisabledAndGreen}
                      disabled={!daySelectionRequired || isDisabledAndGreen}
                      className={cn(isDisabledAndGreen && "data-[state=checked]:bg-success border-success")}
                      onCheckedChange={() => handleCheckboxChange(date)}
                    />
                    <Typography variant="p" className={cn(!daySelectionRequired && "text-primary/50")}>
                      {day}
                    </Typography>
                  </div>
                );
              })}
            </div>
          </div>
          <SheetFooter className="sm:justify-start mt-5 flex-col gap-y-4 w-full">
            <Button onClick={handleApproval} variant="success" className="items-center px-2 gap-x-1">
              <Check className="w-4 h-4" />
              Approve
            </Button>
            
            <TimesheetRejectConfirmationDialog
              onRejection={handleRejection}
              dates={selectedDates}
              employee={teamState.employee}
            />
            
          </SheetFooter>
        </SheetContent>
      )}
    </Sheet>
  );
};

const TimesheetRejectConfirmationDialog = ({
  onRejection,
  dates,
  employee,
}: {
  onRejection: (reason: string) => void;
  dates: Array<string>;
  employee: string;
}) => {
  const form = useForm<z.infer<typeof TimesheetRejectionSchema>>({
    resolver: zodResolver(TimesheetRejectionSchema),
    defaultValues: {
      note: "",
      employee: employee,
      dates: dates,
    },
    mode: "onSubmit",
  });
  const handleSubmit = (data: z.infer<typeof TimesheetRejectionSchema>) => {
    onRejection(data.note);
  };

  useEffect(() => {
    // @ts-ignore
    form.setValue("dates", dates);
  }, [dates, form]);

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="destructive" className="items-center px-2 gap-x-1">
          <X className="w-4 h-4" />
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Reject timesheet</DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="note">Please add reason for rejection.</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Add a note" rows={4} />
                  </FormControl>
                  <FormMessage {...field} />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-start my-2">
              <Button variant="destructive" type="submit" className="items-center px-2 gap-x-1">
                <X className="w-4 h-4" />
                Reject
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
