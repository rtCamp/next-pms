/**
 * External dependencies.
 */
import { useEffect, useReducer, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  Separator,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Spinner,
  Typography,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@next-pms/design-system/components";
import { useToast } from "@next-pms/design-system/components";
import { getUTCDateTime, getFormatedDate } from "@next-pms/design-system/date";
import { floatToTime } from "@next-pms/design-system/utils";
import { useQueryParam } from "@next-pms/hooks";
import { addDays } from "date-fns";
import { useFrappeEventListener, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { isEmpty } from "lodash";
import { Calendar, CalendarArrowDown, EllipsisVertical, Paperclip, Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { TimesheetTable } from "@/app/components/timesheet-table";
import { SubmitButton } from "@/app/components/timesheet-table/components/submitButton";
import { Header, Main } from "@/app/layout/root";
import { parseFrappeErrorMsg, expectatedHours, copyToClipboard, isDateInRange, getTimesheetHours } from "@/lib/utils";
import type { RootState } from "@/store";
import type { WorkingFrequency } from "@/types";
import type { NewTimesheetProps, timesheet } from "@/types/timesheet";
import ExpandableHours from "./components/expandableHours";
import { Footer } from "./components/footer";
import { initialState, reducer } from "./reducer";
import { validateDate } from "./utils";
import { InfiniteScroll } from "../../components/infiniteScroll";

function Timesheet() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [startDateParam, setStartDateParam] = useQueryParam<string>("date", "");
  const user = useSelector((state: RootState) => state.user);
  const hasContractorRole = user.roles.some((role: string) => role === "Contractor");
  const [timesheet, dispatch] = useReducer(reducer, initialState);
  const dailyWorkingHour = expectatedHours(user.workingHours, user.workingFrequency);
  const { data, isLoading, error, mutate } = useFrappeGetCall("next_pms.timesheet.api.timesheet.get_timesheet_data", {
    employee: user.employee,
    start_date: timesheet.weekDate,
    max_week: 4,
  });

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
        dispatch({ type: "APPEND_DATA", payload: data.message });
      } else {
        dispatch({ type: "SET_DATA", payload: data.message });
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
    if (!validateDate(startDateParam, timesheet)) {
      const obj = timesheet.data.data;
      const lastKey = Object.keys(obj).pop();
      if (!lastKey) return;
      const info = obj[lastKey];
      dispatch({ type: "SET_WEEK_DATE", payload: getFormatedDate(addDays(info.start_date, -1)) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, startDateParam, timesheet.data.data, validateDate]);

  useFrappeEventListener(`timesheet_update::${user.employee}`, (payload) => {
    const res = payload.message;
    const key = Object.keys(res.data)[0];
    if (!Object.prototype.hasOwnProperty.call(timesheet.data.data, key)) {
      return;
    }
    dispatch({ type: "APPEND_DATA", payload: res });
  });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    dispatch({ type: "SET_TIMESHEET", payload: timesheetData });
    dispatch({ type: "SET_DIALOG_STATE", payload: true });
  };
  const handleAddLeave = () => {
    dispatch({ type: "SET_LEAVE_DIALOG_STATE", payload: true });
  };

  const onCellClick = (data: NewTimesheetProps) => {
    data.employee = user.employee;
    dispatch({ type: "SET_TIMESHEET", payload: data });
    if (data.hours > 0) {
      dispatch({ type: "SET_EDIT_DIALOG_STATE", payload: true });
    } else {
      dispatch({ type: "SET_DIALOG_STATE", payload: true });
    }
  };
  const loadData = () => {
    const data = timesheet.data.data;
    if (Object.keys(data).length === 0) return;

    const lastKey = Object.keys(data).pop();
    if (!lastKey) return;
    const obj = data[lastKey];
    setStartDateParam("");
    dispatch({ type: "SET_WEEK_DATE", payload: getFormatedDate(addDays(obj.start_date, -1)) });
  };
  const handleApproval = (start_date: string, end_date: string) => {
    const data = {
      start_date: start_date,
      end_date: end_date,
    };
    dispatch({ type: "SET_DATE_RANGE", payload: data });
    dispatch({ type: "SET_APPROVAL_DIALOG_STATE", payload: true });
  };

  const handleImportTaskFromGoogleCalendar = () => {
    dispatch({ type: "SET_IMPORT_FROM_GOOGLE_CALENDAR_DIALOG_STATE", payload: true });
  };

  return (
    <>
      <Header className="justify-end gap-x-3">
        {!hasContractorRole && (
          <Button variant="outline" onClick={handleAddLeave} title="Add Time">
            <Plus />
            Leave
          </Button>
        )}

        <Button onClick={handleAddTime} title="Add Time">
          <Plus />
          Time
        </Button>
        {!hasContractorRole && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-2 [&_div]:cursor-pointer  [&_div]:gap-x-2">
              <DropdownMenuItem onClick={handleImportTaskFromGoogleCalendar}>
                <CalendarArrowDown />
                <Typography variant="p">Import Events From Google Calendar</Typography>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </Header>

      {isLoading && Object.keys(timesheet.data?.data).length == 0 ? (
        <Spinner isFull />
      ) : (
        <>
          {Object.keys(timesheet.data?.data).length == 0 ? (
            <Typography className="flex items-center justify-center">No Data</Typography>
          ) : (
            <Main className="w-full h-full overflow-y-auto">
              <InfiniteScroll isLoading={isLoading} hasMore={true} verticalLodMore={loadData} className="w-full">
                {timesheet.data?.data &&
                  Object.keys(timesheet.data?.data).length > 0 &&
                  Object.entries(timesheet.data?.data).map(([key, value]: [string, timesheet]) => {
                    const data = getTimesheetHours(
                      value.dates,
                      value.total_hours,
                      timesheet.data.leaves,
                      timesheet.data.holidays,
                      dailyWorkingHour
                    );
                    return (
                      <Accordion type="single" collapsible key={key} defaultValue={key}>
                        <AccordionItem value={key}>
                          <AccordionTrigger className="hover:no-underline w-full py-2 max-md:[&>svg]:hidden">
                            <div className="flex justify-between items-center w-full group gap-2 ">
                              <div className="font-normal text-xs sm:text-base flex items-center gap-x-2 max-md:gap-x-3 sm:flex-row overflow-x-auto  max-md:w-4/5">
                                <span className="flex items-center gap-2 shrink-0">
                                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <h2 className="font-medium">{key}</h2>
                                </span>
                                <Separator orientation="vertical" className="block h-5 shrink-0" />
                                <ExpandableHours
                                  totalHours={floatToTime(data.totalHours)}
                                  workingHours={floatToTime(data.totalHours - data.timeOffHours)}
                                  timeoffHours={floatToTime(data.timeOffHours)}
                                />
                                <Paperclip
                                  className="w-3 h-3 hidden group-hover:block shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStartDateParam(getFormatedDate(value.start_date));
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
                                expectedHours={timesheet.data.working_hour}
                                totalHours={data.totalHours}
                                workingFrequency={timesheet.data.working_frequency as WorkingFrequency}
                              />
                            </div>
                          </AccordionTrigger>
                          <AccordionContent
                            className="pb-0"
                            ref={
                              !isEmpty(startDateParam) &&
                              isDateInRange(startDateParam, value.start_date, value.end_date)
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
              </InfiniteScroll>
            </Main>
          )}
        </>
      )}
      <Footer timesheet={timesheet} user={user} dispatch={dispatch} callback={mutate} />
    </>
  );
}

export default Timesheet;
