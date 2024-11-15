import { useToast } from "@/app/components/ui/use-toast";
import { RootState } from "@/store";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setData,
  SetAddTimeDialog,
  SetTimesheet,
  SetWeekDate,
  AppendData,
  setDateRange,
  setEditDialog,
  setApprovalDialog,
} from "@/store/timesheet";
import { LoadMore } from "@/app/components/loadMore";
import { Header, Footer, Main } from "@/app/layout/root";
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
  copyToClipboard,
} from "@/lib/utils";
import { addDays } from "date-fns";
import { Spinner } from "@/app/components/spinner";
import { EditTime } from "./editTime";
import { Approval } from "./Approval";
import { HolidayProp, LeaveProps, NewTimesheetProps, timesheet } from "@/types/timesheet";
import { WorkingFrequency } from "@/types";
import AddTime from "@/app/components/addTime";
import { Paperclip, Plus } from "lucide-react";
import { useQueryParamsState } from "@/lib/queryParam";
import { isEmpty } from "lodash";

function Timesheet() {
  const targetRef = useRef(null);
  const { toast } = useToast();
  const [startDateParam, setstartDateParam] = useQueryParamsState<string>("date", "");
  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);
  const dispatch = useDispatch();
  const working_hour = expectatedHours(user.workingHours, user.workingFrequency);
  const { data, isLoading, error, mutate } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    {
      employee: user.employee,
      start_date: timesheet.weekDate,
      max_week: 4,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );
  const isDateInRange = (date: string, startDate: string, endDate: string) => {
    const targetDate = getDateTimeForMultipleTimeZoneSupport(date);

    return (
      getDateTimeForMultipleTimeZoneSupport(startDate) <= targetDate &&
      targetDate <= getDateTimeForMultipleTimeZoneSupport(endDate)
    );
  };

  const validateDate = () => {
    if (!startDateParam) {
      return true;
    }

    const timesheetData = timesheet.data?.data;
    if (timesheetData && Object.keys(timesheetData).length > 0) {
      const keys = Object.keys(timesheetData);
      const firstObject = timesheetData[keys[0]];
      const lastObject = timesheetData[keys[keys.length - 1]];

      if (isDateInRange(startDateParam, lastObject.start_date, firstObject.end_date)) {
        return true;
      }
    }

    return false;
  };
  useEffect(() => {
    const scrollToElement = () => {
      if (targetRef.current) {
        targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    const observer = new MutationObserver(scrollToElement);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
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
  }, [data, error]);

  useEffect(() => {
    if (Object.keys(timesheet.data.data).length == 0) return;
    if (!validateDate()) {
      const obj = timesheet.data.data;
      const info = obj[Object.keys(obj).pop()];
      dispatch(SetWeekDate(getFormatedDate(addDays(info.start_date, -1))));
    }
  }, [startDateParam, timesheet.data.data]);

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
    if (Object.keys(data).length === 0) return;
    // eslint-disable-next-line
    // @ts-expect-error
    const obj = data[Object.keys(data).pop()];
    setstartDateParam("");
    dispatch(SetWeekDate(getFormatedDate(addDays(obj.start_date, -1))));
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
    <>
      <Header className="justify-end">
        <Button onClick={handleAddTime} title="Add Time">
          <Plus />
          Time
        </Button>
      </Header>

      {isLoading && Object.keys(timesheet.data?.data).length == 0 ? (
        <Spinner isFull />
      ) : (
        <Main>
          {timesheet.data?.data &&
            Object.keys(timesheet.data?.data).length > 0 &&
            Object.entries(timesheet.data?.data).map(([key, value]: [string, timesheet], index: number) => {
              let total_hours = value.total_hours;
              let k = "";
              value.dates.map((date) => {
                let isHoliday = false;
                const holiday = timesheet.data.holidays.find((holiday: HolidayProp) => holiday.holiday_date === date);
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
              if (startDateParam && isDateInRange(startDateParam, value.start_date, value.end_date)) {
                k = key;
              } else if (isEmpty(startDateParam) && index === 0) {
                k = key;
              }
              return (
                <Accordion type="multiple" key={key} defaultValue={[k]}>
                  <AccordionItem value={key}>
                    <AccordionTrigger className="hover:no-underline w-full py-2">
                      <div className="flex justify-between items-center w-full group">
                        <Typography
                          variant="h6"
                          className="font-normal text-xs sm:text-base flex items-center gap-x-1 flex-col sm:flex-row"
                        >
                          {key}:<Typography className="text-xs sm:text-base">{floatToTime(total_hours)}h</Typography>
                          <Paperclip
                            className="w-3 h-3 hidden group-hover:block"
                            onClick={(e) => {
                              e.stopPropagation();
                              setstartDateParam(value.start_date);
                              copyToClipboard(
                                `${window.location.origin}${window.location.pathname}?date="${value.start_date}"`
                              );
                            }}
                          />
                        </Typography>
                        <SubmitButton
                          start_date={value.start_date}
                          end_date={value.end_date}
                          onApproval={handleApproval}
                          status={value.status}
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent
                      className="pb-0"
                      ref={
                        !isEmpty(startDateParam) && isDateInRange(startDateParam, value.start_date, value.end_date)
                          ? targetRef
                          : null
                      }
                    >
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
        </Main>
      )}
      <Footer>
        <LoadMore className="float-left" variant="outline" onClick={loadData} disabled={isLoading} />
      </Footer>
      {timesheet.isDialogOpen && (
        <AddTime
          open={timesheet.isDialogOpen}
          onOpenChange={() => {
            dispatch(SetAddTimeDialog(false));
            mutate();
          }}
          onSuccess={() => {
            mutate();
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
          onClose={() => {
            dispatch(setEditDialog(false));
            mutate();
          }}
        />
      )}
      {timesheet.isAprrovalDialogOpen && <Approval onClose={mutate} />}
    </>
  );
}

export default Timesheet;
