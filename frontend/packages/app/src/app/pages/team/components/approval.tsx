/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import {
  Spinner,
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@next-pms/design-system/components";
import { getDateFromDateAndTimeString, prettyDate } from "@next-pms/design-system/date";
import { useToast } from "@next-pms/design-system/hooks";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Check, LoaderCircle } from "lucide-react";

/**
 * Internal dependencies.
 */
import { calculateExtendedWorkingHour, mergeClassNames, expectatedHours, parseFrappeErrorMsg } from "@/lib/utils";
import type { WorkingFrequency } from "@/types";
import type { HolidayProp, LeaveProps, NewTimesheetProps, timesheet } from "@/types/timesheet";
import { RejectTimesheet } from "./rejectTimesheet";
import { EmployeeTimesheetListItem } from "../employee-detail/employee-timesheet-list/timesheetListItem";
import { getTaskDataForDate, getTimesheetHourForDate } from "../utils";
import type { ApprovalProp } from "./types";

export const Approval = ({ onClose, employee, startDate, endDate, isAprrovalDialogOpen }: ApprovalProp) => {
  const { toast } = useToast();
  const [timesheetData, setTimesheetData] = useState<timesheet>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [workingHour, setWorkingHour] = useState<number>(0);
  const [WorkingFrequency, setWorkingFrequency] = useState<WorkingFrequency>("Per Day");
  const [holidays, setHoliday] = useState<Array<HolidayProp>>([]);
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
  const dailyWorkingHour = expectatedHours(workingHour, WorkingFrequency);
  return (
    <Sheet open={isAprrovalDialogOpen} onOpenChange={handleOpen} modal={true}>
      <SheetContent className="md:max-w-4xl w-full sm:max-w-full overflow-auto ">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>
                Week of {prettyDate(startDate).date} - {prettyDate(endDate).date}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-y-4 mt-6 ">
              <div>
                {timesheetData &&
                  timesheetData.dates.map((date: string, index: number) => {
                    const matchingTasks = getTaskDataForDate(timesheetData.tasks, date);
                    const data = getTimesheetHourForDate(date, matchingTasks, holidays, leaves, dailyWorkingHour);
                    const isChecked = selectedDates.includes(date);
                    const submittedTime = matchingTasks?.some(
                      (timesheet) =>
                        getDateFromDateAndTimeString(timesheet.from_time) === date && timesheet.docstatus === 1
                    );
                    const isExtended = calculateExtendedWorkingHour(data.totalHours, workingHour, WorkingFrequency);
                    return (
                      <EmployeeTimesheetListItem
                        employee={employee}
                        hasLeave={data.hasLeave}
                        showCheckbox
                        onCheckedChange={handleCheckboxChange}
                        checkboxClassName={mergeClassNames(
                          submittedTime && "data-[state=checked]:bg-success border-success"
                        )}
                        isCheckboxChecked={isChecked || submittedTime}
                        isCheckboxDisabled={
                          submittedTime ||
                          data.isHoliday ||
                          (data.hasLeave && !data.isHoliday && matchingTasks.length == 0) ||
                          matchingTasks.length == 0
                        }
                        tasks={matchingTasks}
                        date={date}
                        isTimeExtended={isExtended}
                        isHoliday={data.isHoliday}
                        holidayDescription={data.holidayDescription}
                        dailyWorkingHour={workingHour}
                        totalHours={data.totalHours}
                        isHalfDayLeave={data.isHalfDayLeave}
                        index={index}
                        handleTimeChange={handleTimeChange}
                        hourInputClassName="max-sm:ml-0 "
                      />
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

              <RejectTimesheet
                onRejection={handleOpen}
                isRejecting={isRejecting}
                setIsRejecting={setIsRejecting}
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
