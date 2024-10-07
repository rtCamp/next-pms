import { useToast } from "@/app/components/ui/use-toast";
import { RootState } from "@/store";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setData,
  SetAddTimeDialog,
  SetTimesheet,
  SetFetchAgain,
  SetWeekDate,
  AppendData,
  setDateRange,
  setEditDialog,
  setApprovalDialog,
} from "@/store/timesheet";
import { Button } from "@/app/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { Typography } from "@/app/components/typography";
import TimesheetTable, { SubmitButton } from "@/app/components/timesheetTable";
import {
  parseFrappeErrorMsg,
  getFormatedDate,
  floatToTime,
  expectatedHours,
  getDateTimeForMultipleTimeZoneSupport,
} from "@/lib/utils";
import { addDays } from "date-fns";
import { Spinner } from "@/app/components/spinner";
import { EditTime } from "./editTime";
import { Approval } from "./Approval";
import { LeaveProps, NewTimesheetProps, timesheet } from "@/types/timesheet";
import { WorkingFrequency } from "@/types";
import AddTime from "@/app/components/addTime";

function Timesheet() {
  const { toast } = useToast();
  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);
  const dispatch = useDispatch();
  const working_hour = expectatedHours(user.workingHours, user.workingFrequency);
  const { data, isLoading, error, mutate } = useFrappeGetCall("frappe_pms.timesheet.api.timesheet.get_timesheet_data", {
    employee: user.employee,
    start_date: timesheet.weekDate,
    max_week: 4,
  });

  useEffect(() => {
    if (timesheet.isFetchAgain) {
      mutate();
      dispatch(SetFetchAgain(false));
    }
    if (data) {
      if (timesheet.data?.data && Object.keys(timesheet.data?.data).length > 0) {
        dispatch(AppendData(data.message));
      } else {
        dispatch(setData(data.message));
      }
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error, timesheet.isFetchAgain]);

  const handleAddTime = () => {
    const timesheetData = {
      name: "",
      task: "",
      date: getFormatedDate(getDateTimeForMultipleTimeZoneSupport()),
      description: "",
      hours: 0,
      employee: user.employee,
      project: "",
    };
    dispatch(SetTimesheet(timesheetData));
    dispatch(SetAddTimeDialog(true));
  };

  const onCellClick = (data: NewTimesheetProps) => {
    data.employee = user.employee;
    dispatch(SetTimesheet(data));
    if (data.hours > 0) {
      dispatch(setEditDialog(true));
    } else {
      dispatch(SetAddTimeDialog(true));
    }
  };
  const loadData = () => {
    const data = timesheet.data.data;
    if (!data) return;
    // eslint-disable-next-line
    // @ts-expect-error
    const obj = data[Object.keys(data).pop()];

    dispatch(SetWeekDate(getFormatedDate(addDays(obj.start_date, -1))));
    dispatch(SetFetchAgain(true));
  };
  const handleApproval = (start_date: string, end_date: string) => {
    const data = {
      start_date: start_date,
      end_date: end_date,
    };
    dispatch(setDateRange(data));
    dispatch(setApprovalDialog(true));
  };
  if (error) {
    return <></>;
  }
  return (
    <div className="flex flex-col">
      <div>
        <Button className="float-right mb-1" onClick={handleAddTime}>
          Add Time
        </Button>
      </div>
      {isLoading && Object.keys(timesheet.data?.data).length == 0 ? (
        <Spinner isFull />
      ) : (
        <div className="overflow-y-auto" style={{ height: "calc(100vh - 8rem)" }}>
          {timesheet.data?.data &&
            Object.keys(timesheet.data?.data).length > 0 &&
            Object.entries(timesheet.data?.data).map(([key, value]: [string, timesheet], index: number) => {
              let total_hours = value.total_hours;
              value.dates.map((date) => {
                let isHoliday = false;
                const holiday = timesheet.data.holidays.find((holiday) => holiday.holiday_date === date);
                if (holiday) {
                  isHoliday = true;
                  if (!holiday.weekly_off) {
                    total_hours += working_hour;
                  }
                }
                const leaveData = timesheet.data.leaves.filter((data: LeaveProps) => {
                  return date >= data.from_date && date <= data.to_date;
                });

                if (leaveData.length > 0 && !isHoliday) {
                  leaveData.forEach((data: LeaveProps) => {
                    const isHalfDayLeave = data.half_day && data.half_day_date == date;
                    if (isHalfDayLeave) {
                      total_hours += working_hour / 2;
                    } else {
                      total_hours += working_hour;
                    }
                  });
                }
              });

              return (
                <Accordion type="multiple" key={key} defaultValue={index === 0 ? [key] : undefined}>
                  <AccordionItem value={key}>
                    <AccordionTrigger className="hover:no-underline w-full py-2">
                      <div className="flex justify-between items-center w-full">
                        <Typography variant="h6" className="font-normal">
                          {key}: {floatToTime(total_hours)}h
                        </Typography>
                        <SubmitButton
                          start_date={value.start_date}
                          end_date={value.end_date}
                          onApproval={handleApproval}
                          status={value.status}
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <TimesheetTable
                        working_hour={timesheet.data.working_hour}
                        working_frequency={timesheet.data.working_frequency as WorkingFrequency}
                        dates={value.dates}
                        holidays={timesheet.data.holidays}
                        leaves={timesheet.data.leaves}
                        tasks={value.tasks}
                        onCellClick={onCellClick}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            })}
        </div>
      )}
      <div className="mt-5">
        <Button className="float-left" variant="outline" onClick={loadData} disabled={isLoading}>
          Load More
        </Button>
      </div>
      {timesheet.isDialogOpen && (
        <AddTime
          open={timesheet.isDialogOpen}
          onOpenChange={() => {
            dispatch(SetAddTimeDialog(false));
          }}
          onSuccess={() => {
            dispatch(SetFetchAgain(true));
          }}
          initialDate={timesheet.timesheet.date}
          employee={user.employee}
          workingFrequency={user.workingFrequency}
          workingHours={user.workingHours}
          task={timesheet.timesheet.task}
          project={timesheet.timesheet.project}
        />
      )}
      {timesheet.isEditDialogOpen && (
        <EditTime
          employee={timesheet.timesheet.employee as string}
          date={timesheet.timesheet.date}
          task={timesheet.timesheet.task}
          open={timesheet.isEditDialogOpen}
          onClose={() => dispatch(setEditDialog(false))}
        />
      )}
      {timesheet.isAprrovalDialogOpen && <Approval />}
    </div>
  );
}

export default Timesheet;
