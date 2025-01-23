/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Button,
  Separator,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Spinner,
} from "@next-pms/design-system/components";
import { useToast } from "@next-pms/design-system/components";
import { getUTCDateTime, normalizeDate, getFormatedDate } from "@next-pms/design-system/date";
import { floatToTime } from "@next-pms/design-system/utils";
import { useQueryParam } from "@next-pms/hooks";
import { addDays } from "date-fns";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { isEmpty } from "lodash";
import { Calendar, Paperclip, Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import AddLeave from "@/app/components/addLeave";
import AddTime from "@/app/components/AddTime";
import { TimesheetTable } from "@/app/components/timesheet-table";
import { SubmitButton } from "@/app/components/timesheet-table/components/submitButton";
import { Header, Main } from "@/app/layout/root";
import { parseFrappeErrorMsg, expectatedHours, copyToClipboard } from "@/lib/utils";
import { RootState } from "@/store";
import {
  setData,
  SetAddTimeDialog,
  SetTimesheet,
  SetWeekDate,
  AppendData,
  setDateRange,
  setEditDialog,
  setApprovalDialog,
  SetAddLeaveDialog,
} from "@/store/timesheet";
import { WorkingFrequency } from "@/types";
import { HolidayProp, LeaveProps, NewTimesheetProps, timesheet } from "@/types/timesheet";
import { Approval } from "./approval";
import { EditTime } from "./editTime";
import ExpandableHours from "./expandableHours";
import { InfiniteScroll } from "../resource_management/components/InfiniteScroll";

function Timesheet() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [startDateParam, setstartDateParam] = useQueryParam<string>("date", "");
  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);
  const dispatch = useDispatch();
  const working_hour = expectatedHours(user.workingHours, user.workingFrequency);
  const { data, isLoading, error, mutate } = useFrappeGetCall("next_pms.timesheet.api.timesheet.get_timesheet_data", {
    employee: user.employee,
    start_date: timesheet.weekDate,
    max_week: 4,
  });
  const isDateInRange = (date: string, startDate: string, endDate: string) => {
    const targetDate = getUTCDateTime(normalizeDate(date));

    return getUTCDateTime(startDate) <= targetDate && targetDate <= getUTCDateTime(endDate);
  };

  const validateDate = useCallback(() => {
    if (!startDateParam) {
      return true;
    }
    const date = getFormatedDate(normalizeDate(startDateParam));
    const timesheetData = timesheet.data?.data;
    if (timesheetData && Object.keys(timesheetData).length > 0) {
      const keys = Object.keys(timesheetData);
      const firstObject = timesheetData[keys[0]];
      const lastObject = timesheetData[keys[keys.length - 1]];
      if (isDateInRange(date, lastObject.start_date, firstObject.end_date)) {
        return true;
      }
    }

    return false;
  }, [startDateParam, timesheet.data?.data]);

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
  }, [data, dispatch, error, toast]);

  useEffect(() => {
    if (Object.keys(timesheet.data.data).length == 0) return;
    if (!validateDate()) {
      const obj = timesheet.data.data;
      const lastKey = Object.keys(obj).pop();
      if (!lastKey) return;
      const info = obj[lastKey];
      dispatch(SetWeekDate(getFormatedDate(addDays(info.start_date, -1))));
    }
  }, [dispatch, startDateParam, timesheet.data.data, validateDate]);

  const { call: fetchLikedTask, loading: loadingLikedTasks } = useFrappePostCall(
    "next_pms.timesheet.api.task.get_liked_tasks"
  );
  const [likedTaskData, setLikedTaskData] = useState([]);

  const getLikedTaskData = () => {
    fetchLikedTask({}).then((res) => {
      setLikedTaskData(res.message ?? []);
    });
  };

  useEffect(() => {
    getLikedTaskData();
  }, []);

  const handleAddTime = () => {
    const timesheetData = {
      name: "",
      task: "",
      date: getFormatedDate(getUTCDateTime()),
      description: "",
      hours: 0,
      employee: user.employee,
      project: "",
    };
    dispatch(SetTimesheet(timesheetData));
    dispatch(SetAddTimeDialog(true));
  };
  const handleAddLeave = () => {
    dispatch(SetAddLeaveDialog(true));
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

    const lastKey = Object.keys(data).pop();
    if (!lastKey) return;
    const obj = data[lastKey];
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
      <Header className="justify-end gap-x-3">
        <Button variant="outline" onClick={handleAddLeave} title="Add Time">
          <Plus />
          Leave
        </Button>
        <Button onClick={handleAddTime} title="Add Time">
          <Plus />
          Time
        </Button>
      </Header>

      {isLoading && Object.keys(timesheet.data?.data).length == 0 ? (
        <Spinner isFull />
      ) : (
        <div className="w-full h-full overflow-y-auto">
          <InfiniteScroll isLoading={isLoading} hasMore={true} verticalLodMore={loadData} className="w-full">
            <Main>
              {timesheet.data?.data &&
                Object.keys(timesheet.data?.data).length > 0 &&
                Object.entries(timesheet.data?.data).map(([key, value]: [string, timesheet], index: number) => {
                  let total_hours = value.total_hours;
                  let timeoff_hours = 0;
                  value.dates.map((date) => {
                    let isHoliday = false;
                    const holiday = timesheet.data.holidays.find(
                      (holiday: HolidayProp) => holiday.holiday_date === date
                    );
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
                          timeoff_hours += working_hour / 2;
                        } else {
                          total_hours += working_hour;
                          timeoff_hours += working_hour;
                        }
                      });
                    }
                  });
                  return (
                    <Accordion type="single" collapsible key={key} defaultValue={key}>
                      <AccordionItem value={key}>
                        <AccordionTrigger className="hover:no-underline w-full py-2 max-md:[&>svg]:hidden">
                          <div className="flex justify-between items-center w-full group gap-2 ">
                            <div className="font-normal text-xs sm:text-base flex items-center gap-x-2 max-md:gap-x-3 sm:flex-row overflow-x-auto no-scrollbar max-md:w-4/5">
                              <span className="flex items-center gap-2 shrink-0">
                                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                <h2 className="font-medium">{key}</h2>
                              </span>
                              <Separator orientation="vertical" className="block h-5 shrink-0" />
                              <ExpandableHours
                                totalHours={floatToTime(total_hours)}
                                workingHours={floatToTime(total_hours - timeoff_hours)}
                                timeoffHours={floatToTime(timeoff_hours)}
                              />
                              <Paperclip
                                className="w-3 h-3 hidden group-hover:block shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setstartDateParam(getFormatedDate(value.start_date));
                                  copyToClipboard(
                                    `${window.location.origin}${window.location.pathname}?date="${value.start_date}"`
                                  );
                                }}
                              />
                            </div>
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
                            workingHour={timesheet.data.working_hour}
                            workingFrequency={timesheet.data.working_frequency as WorkingFrequency}
                            dates={value.dates}
                            holidays={timesheet.data.holidays}
                            leaves={timesheet.data.leaves}
                            tasks={value.tasks}
                            onCellClick={onCellClick}
                            weeklyStatus={value.status}
                            disabled={value.status === "Approved"}
                            importTasks={true}
                            loadingLikedTasks={loadingLikedTasks}
                            likedTaskData={likedTaskData}
                            getLikedTaskData={getLikedTaskData}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                })}
            </Main>
          </InfiniteScroll>
        </div>
      )}
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
          employeeName={user.employeeName}
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
      {timesheet.isLeaveDialogOpen && (
        <AddLeave
          employee={user.employee}
          open={timesheet.isLeaveDialogOpen}
          onOpenChange={() => {
            dispatch(SetAddLeaveDialog(false));
            mutate();
          }}
          onSuccess={() => {
            mutate();
          }}
        />
      )}
    </>
  );
}

export default Timesheet;
