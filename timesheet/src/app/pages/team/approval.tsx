// @ts-nocheck
import { useToast } from "@/app/components/ui/use-toast";
import { RootState } from "@/store";
import { useSelector, useDispatch } from "react-redux";
import { setDateRange, setFetchAgain } from "@/store/team";
import { Button } from "@/app/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/app/components/ui/hover-card";
import {
  calculateExtendedWorkingHour,
  cn,
  getDateFromDateAndTime,
  parseFrappeErrorMsg,
  prettyDate,
  floatToTime,
  truncateText,
  preProcessLink,
} from "@/lib/utils";
import { useEffect, useState } from "react";
import { useFrappeGetCall, useFrappePostCall, useFrappeGetDocList } from "frappe-react-sdk";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/app/components/ui/sheet";
import { Spinner } from "@/app/components/spinner";
import { LeaveProps, NewTimesheetProps, TaskDataItemProps, timesheet } from "@/types/timesheet";
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

type Holiday = {
  holiday_date: string;
  description: string;
};
export const Approval = () => {
  const { toast } = useToast();
  const teamState = useSelector((state: RootState) => state.team);
  const [timesheetData, setTimesheetData] = useState<timesheet>();
  const [working_hour, setWorkingHour] = useState<number>(0);
  const [working_frequency, setWorkingFrequency] = useState<WorkingFrequency>("Per Day");
  const [holidays, setHoliday] = useState<Array<Holiday>>([]);
  const [leaves, setLeave] = useState<LeaveProps[]>([]);
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
    holiday_with_description: true,
  });
  const handleOpen = () => {
    const data = { start_date: "", end_date: "" };
    dispatch(setDateRange({ dateRange: data, employee: "", isAprrovalDialogOpen: false }));
    dispatch(setFetchAgain(true));
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
      setLeave(data.message.leaves);
      setHoliday(data.message.holidays);
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
      const filteredDates = timesheetData.dates.filter((date) => {
        const isLeaveDate = leaves.some((leave: LeaveProps) => {
          return date >= leave.from_date && date <= leave.to_date && leave.half_day == false;
        });
        const isHoliday = holidays.some((holiday) => holiday.holiday_date === date);
        return !validDates.includes(date) && !isHoliday && !isLeaveDate;
      });
      setSelectedDates(filteredDates ?? []);
    }
  }, [holidays, leaves, timesheetData, timesheetList]);

  return (
    <Sheet open={teamState.isAprrovalDialogOpen} onOpenChange={handleOpen} modal={true}>
      {(isLoading || isTimesheetListLoading) && <Spinner />}
      {timesheetData && (
        <SheetContent className="sm:max-w-4xl overflow-auto">
          <SheetHeader>
            <SheetTitle>
              Week of {prettyDate(teamState.dateRange.start_date).date} -{" "}
              {prettyDate(teamState.dateRange.end_date).date}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-y-4 mt-6">
            <div>
              {timesheetData.dates.map((date: string, index: number) => {
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
                let totalHours = matchingTasks.reduce((sum, task) => sum + task.hours, 0);
                const isChecked = selectedDates.includes(date);
                const holiday = holidays.find((holiday) => holiday.holiday_date === date);
                const isHoliday = !!holiday;
                const submittedTime = timesheetList?.some(
                  (timesheet) => timesheet.start_date === date && timesheet.docstatus === 1
                );
                const leave = leaves.find((data: LeaveProps) => {
                  return date >= data.from_date && date <= data.to_date;
                });
                const isHalfDayLeave = leave?.half_day && leave?.half_day_date == date ? true : false;
                if (leave && !isHoliday) {
                  if (isHalfDayLeave) {
                    totalHours += (expectatedHours(working_hour, working_frequency)/2) ;
                  } else {
                    totalHours +=  expectatedHours(working_hour, working_frequency);
                  }
                }

                const isExtended = calculateExtendedWorkingHour(totalHours, working_hour, working_frequency);
                return (
                  <div key={index} className="flex flex-col ">
                    <div className="bg-gray-100 rounded p-1 border-b flex items-center gap-x-2">
                      <Checkbox
                        disabled={
                          submittedTime ||
                          (isHoliday && matchingTasks.length == 0) ||
                          (leave && !isHalfDayLeave && !isHoliday)
                        }
                        checked={isChecked || submittedTime || isHalfDayLeave}
                        className={cn(submittedTime && "data-[state=checked]:bg-success border-success")}
                        onCheckedChange={() => handleCheckboxChange(date)}
                      />
                      <Typography
                        variant="p"
                        className={cn(
                          isExtended == 0 && "text-destructive",
                          isExtended && "text-success",
                          isExtended == 2 && "text-warning"
                        )}
                      >
                        {floatToTime(totalHours)}h
                      </Typography>
                      <Typography variant="p">{prettyDate(date).date}</Typography>
                      {isHoliday && (
                        <Typography variant="p" className="text-gray-600">
                          {holiday.description}
                        </Typography>
                      )}
                      {leave && !isHoliday && (
                        <Typography variant="p" className="text-gray-600">
                          ({isHalfDayLeave ? "Half day leave" : "Full Day Leave"})
                        </Typography>
                      )}
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
                      const description = preProcessLink(task.description ?? "");
                      return (
                        <div className="flex gap-x-2 py-1 pl-1 border-b last:border-b-0" key={index}>
                          <TimeInput
                            disabled={task.docstatus == 1}
                            data={data}
                            className="w-10 p-1 ml-6  h-8"
                            callback={handleTimeChange}
                            employee={teamState.employee}
                          />
                          <div className="grid w-full grid-cols-3 ">
                            <Typography variant="p" className="font-bold ">
                              {task.taskName}
                            </Typography>

                            <HoverCard openDelay={50} closeDelay={50}>
                              <HoverCardTrigger className="text-sm font-normal col-span-2 hover:cursor-pointer">
                                <p dangerouslySetInnerHTML={{ __html: truncateText(description, 150) }}></p>
                              </HoverCardTrigger>
                              <HoverCardContent className="text-sm font-normal overflow-auto max-h-72 max-w-lg w-full">
                                <p dangerouslySetInnerHTML={{ __html: description }}></p>
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        </div>
                      );
                    })}
                    {matchingTasks.length == 0 && (
                      <Typography variant="p" className="text-center p-3">
                        No data
                      </Typography>
                    )}
                  </div>
                );
              })}
            </div>
            <Separator />
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
        <div>
          <Typography variant="p">The following day's timesheet will be rejected</Typography>
          <ol className="list-disc pl-6">
            {dates.map((date: string, index: number) => {
              return (
                <li key={index} className="text-sm">
                  {prettyDate(date).date}
                </li>
              );
            })}
          </ol>
        </div>
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
