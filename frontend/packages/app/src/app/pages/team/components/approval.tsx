/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Spinner,
  Typography,
  Checkbox,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  TextArea,
} from "@next-pms/design-system/components";
import { getDateFromDateAndTimeString, prettyDate } from "@next-pms/design-system/date";
import { useToast } from "@next-pms/design-system/hooks";
import { floatToTime, preProcessLink } from "@next-pms/design-system/utils";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Check, CircleDollarSign, LoaderCircle, X } from "lucide-react";
import { z } from "zod";
/**
 * Internal dependencies.
 */
import { TimeInput } from "@/app/pages/team/employeeDetail";
import { calculateExtendedWorkingHour, cn, parseFrappeErrorMsg } from "@/lib/utils";
import { TimesheetRejectionSchema } from "@/schema/timesheet";
import { WorkingFrequency } from "@/types";
import { LeaveProps, NewTimesheetProps, TaskDataItemProps, TaskDataProps, timesheet } from "@/types/timesheet";

type Holiday = {
  holiday_date: string;
  description: string;
};
interface ApprovalProp {
  onClose: (data: any) => void;
  employee:string;
  startDate:string;
  endDate:string;
  isAprrovalDialogOpen:boolean
}
export const Approval = ({ onClose,employee,startDate,endDate,isAprrovalDialogOpen }: ApprovalProp) => {
  const { toast } = useToast();
  const [timesheetData, setTimesheetData] = useState<timesheet>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [working_hour, setWorkingHour] = useState<number>(0);
  const [working_frequency, setWorkingFrequency] = useState<WorkingFrequency>("Per Day");
  const [holidays, setHoliday] = useState<Array<Holiday>>([]);
  const [leaves, setLeave] = useState<LeaveProps[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const { call } = useFrappePostCall("next_pms.timesheet.api.team.approve_or_reject_timesheet");
  const { call: updateTime } = useFrappePostCall("next_pms.timesheet.api.timesheet.update_timesheet_detail");

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
  const { data, isLoading, error, mutate } = useFrappeGetCall("next_pms.timesheet.api.timesheet.get_timesheet_data", {
    employee: employee,
    start_date: startDate,
    max_week: 1,
    holiday_with_description: true,
  });
  const handleOpen = () => {
    if (isRejecting || isSubmitting) return;
    onClose(selectedDates[0]);
  };
  const handleApproval = () => {
    setIsSubmitting(true);
    const data = {
      dates: selectedDates,
      status: "Approved",
      employee: employee,
    };
    call(data)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        setIsSubmitting(false);
        handleOpen();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
        setIsSubmitting(false);
      });
  };
  const handleRejection = (reason: string) => {
    setIsRejecting(true);
    const data = {
      dates: selectedDates,
      status: "Rejected",
      employee: employee,
      note: reason,
    };
    call(data)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        setIsRejecting(false);
        handleOpen();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
        setIsRejecting(false);
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
    if (timesheetData) {
      const filteredDates = timesheetData.dates
        .filter((date) => {
          const isLeaveDate = leaves.some((leave: LeaveProps) => {
            return date >= leave.from_date && date <= leave.to_date && leave.half_day == false;
          });
          const isHoliday = holidays.some((holiday) => holiday.holiday_date === date);
          return !isHoliday && !isLeaveDate;
        })
        .filter((date) => {
          const hasTimeOrSubmitted = Object.values(timesheetData.tasks).some((task) =>
            task.data.some((entry) => getDateFromDateAndTimeString(entry.from_time) === date)
          );
          return hasTimeOrSubmitted;
        });
      setSelectedDates(filteredDates ?? []);
    }
  }, [holidays, leaves, timesheetData]);

  return (
    <Sheet open={isAprrovalDialogOpen} onOpenChange={handleOpen} modal={true}>
      <SheetContent className="sm:max-w-4xl overflow-auto">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>
                Week of {prettyDate(startDate).date} -{" "}
                {prettyDate(endDate).date}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-y-4 mt-6">
              <div>
                {timesheetData &&
                  timesheetData.dates.map((date: string, index: number) => {
                    const matchingTasks = Object.entries(timesheetData.tasks).flatMap(
                      ([, task]: [string, TaskDataProps]) =>
                        task.data
                          .filter(
                            (taskItem: TaskDataItemProps) => getDateFromDateAndTimeString(taskItem.from_time) === date
                          )
                          .map((taskItem: TaskDataItemProps) => ({
                            ...taskItem,
                            subject: task.subject,
                            project_name: task.project_name,
                          }))
                    );
                    let totalHours = matchingTasks.reduce((sum, task) => sum + task.hours, 0);
                    const isChecked = selectedDates.includes(date);
                    const holiday = holidays.find((holiday) => holiday.holiday_date === date);
                    const isHoliday = !!holiday;
                    const submittedTime = matchingTasks?.some(
                      (timesheet) =>
                        getDateFromDateAndTimeString(timesheet.from_time) === date && timesheet.docstatus === 1
                    );
                    const leave = leaves.filter((data: LeaveProps) => {
                      return date >= data.from_date && date <= data.to_date;
                    });
                    let isHalfDayLeave = false;
                    if (leave.length > 0 && !isHoliday) {
                      leave.forEach((data: LeaveProps) => {
                        isHalfDayLeave = data.half_day && data.half_day_date == date;
                        if (isHalfDayLeave) {
                          totalHours += working_hour / 2;
                        } else {
                          totalHours += working_hour;
                        }
                      });
                    }

                    const isExtended = calculateExtendedWorkingHour(totalHours, working_hour, working_frequency);

                    return (
                      <div key={index} className="flex flex-col ">
                        <div className="bg-gray-100 rounded p-1 border-b flex items-center gap-x-2">
                          <Checkbox
                            disabled={
                              submittedTime ||
                              isHoliday ||
                              (leave.length != 0 && !isHoliday && matchingTasks.length == 0) ||
                              matchingTasks.length == 0
                            }
                            checked={isChecked || submittedTime}
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
                          {leave.length > 0 && !isHoliday && (
                            <Typography variant="p" className="text-gray-600">
                              ({isHalfDayLeave && totalHours != working_hour ? "Half day leave" : "Full Day Leave"})
                            </Typography>
                          )}
                        </div>
                        {matchingTasks?.map((task: TaskDataItemProps, index: number) => {
                          const data = {
                            name: task.name,
                            parent: task.parent,
                            task: task.task,
                            employee: employee,
                            date: getDateFromDateAndTimeString(task.from_time),
                            description: task.description,
                            hours: task.hours,
                            is_billable: task.is_billable,
                          };
                          const description = preProcessLink(task.description ?? "");
                          return (
                            <div className="flex gap-x-2 py-1 pl-1 border-b last:border-b-0" key={index}>
                              <TimeInput
                                disabled={task.docstatus == 1}
                                data={data}
                                className="w-10 p-1 ml-6  h-8"
                                callback={handleTimeChange}
                                employee={employee}
                              />
                              <div className="md:grid w-full md:grid-cols-3 gap-x-2 flex flex-col max-md:overflow-hidden max-md:text-wrap ">
                                <div className="flex gap-1">
                                  <div
                                    title={task.is_billable == 1 ? "Billable task" : ""}
                                    className={cn(
                                      task.is_billable === 1 && "cursor-pointer",
                                      "w-4  flex justify-center flex-none"
                                    )}
                                  >
                                    {task.is_billable === 1 && (
                                      <CircleDollarSign className="w-4 h-4 ml-1 stroke-success" />
                                    )}
                                  </div>
                                  <div className="flex flex-col max-w-52">
                                    <Typography variant="p" className="truncate">
                                      {task.subject}
                                    </Typography>
                                    <Typography variant="small" className="truncate text-slate-500">
                                      {task.project_name}
                                    </Typography>
                                  </div>
                                </div>

                                <p
                                  className="text-sm font-normal  col-span-2 max-md:px-4 my-1"
                                  dangerouslySetInnerHTML={{ __html: description }}
                                ></p>
                              </div>
                            </div>
                          );
                        })}
                        {matchingTasks.length == 0 && (
                          <Typography variant="p" className="text-center p-3 text-gray-400">
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
              <Button onClick={handleApproval} variant="success" disabled={selectedDates.length == 0 || isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin w-4 h-4" /> : <Check />}
                Approve
              </Button>

              <TimesheetRejectConfirmationDialog
                onRejection={handleRejection}
                isSubmitting={isRejecting}
                dates={selectedDates}
                employee={employee}
                disabled={selectedDates.length == 0 || isRejecting}
              />
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

const TimesheetRejectConfirmationDialog = ({
  onRejection,
  dates,
  employee,
  disabled,
  isSubmitting,
}: {
  onRejection: (reason: string) => void;
  dates: Array<string>;
  employee: string;
  disabled: boolean;
  isSubmitting: boolean;
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    form.setValue("dates", dates);
  }, [dates, form]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" disabled={disabled}>
          <X />
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
                    <TextArea {...field} placeholder="Add a note" rows={4} />
                  </FormControl>
                  <FormMessage {...field} />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-start my-2">
              <Button variant="destructive" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin w-4 h-4" /> : <X />}
                Reject
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
