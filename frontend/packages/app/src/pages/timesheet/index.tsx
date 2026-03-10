/**
 * External dependencies.
 */
import { useEffect, useReducer, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Spinner,
  Typography,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@next-pms/design-system/components";
import { useToast } from "@next-pms/design-system/components";
import { getUTCDateTime, getFormatedDate } from "@next-pms/design-system/date";

import { useQueryParam } from "@next-pms/hooks";
import { Button, Breadcrumbs, TextInput, Select, Filter } from "@rtcamp/frappe-ui-react";
import { addDays } from "date-fns";
import { useFrappeEventListener, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { isEmpty } from "lodash";
import { CalendarArrowDown, CalendarX2, EllipsisVertical, Plus, Clock, ChevronDown, Ellipsis } from "lucide-react";

/**
 * Internal dependencies.
 */
import { TimesheetTable } from "@/components/timesheet-table";
import { SubmitButton } from "@/components/timesheet-table/components/submitButton";
import { Header, Main } from "@/layout/root";
import { parseFrappeErrorMsg, expectatedHours, copyToClipboard, isDateInRange, getTimesheetHours } from "@/lib/utils";
import type { RootState } from "@/store";
import type { WorkingFrequency } from "@/types";
import type { NewTimesheetProps, timesheet } from "@/types/timesheet";
import { Footer } from "./components/footer";
import { initialState, reducer } from "./reducer";
import { validateDate } from "./utils";
import { InfiniteScroll } from "../../components/infiniteScroll";
import { sampleFields } from "./constants";

function Timesheet() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  const [startDateParam, setStartDateParam] = useQueryParam<string>("date", "");
  const user = useSelector((state: RootState) => state.user);
  const [timesheet, dispatch] = useReducer(reducer, initialState);
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
    "next_pms.timesheet.api.task.get_liked_tasks",
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
  const handleAddTimeOff = () => {
    dispatch({ type: "SET_TIME_OFF_DIALOG_STATE", payload: true });
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
      <Header className="justify-between">
        <Breadcrumbs
          items={[
            {
              id: "timesheets",
              label: "Timesheets",
            },
            {
              id: "personal",
              label: "Personal",
              prefixIcon: <Clock className="w-4 h-4" />,
              suffixIcon: <ChevronDown className="w-4 h-4" />,
              dropdown: {
                dropdownClassName: "w-[220px] px-1",
                groupClassName: "px-0 py-1 space-y-1",
                itemClassName: "text-ink-gray-8 hover:text-ink-gray-7",
                selectedKey: "personal",
                selectedGroupKey: "views-group",
                options: [
                  {
                    group: "",
                    key: "views-group",
                    items: [
                      {
                        label: "Personal",
                        key: "personal",
                        icon: "clock",
                        onClick: () => console.log("personal"),
                      },
                      {
                        label: "Team",
                        key: "team",
                        icon: "copy",
                        onClick: () => console.log("team"),
                      },
                      {
                        label: "Project",
                        key: "project",
                        icon: "briefcase",
                        onClick: () => console.log("project"),
                      },
                    ],
                  },
                ],
              },
            },
          ]}
        />
        <div className="flex gap-2">
          {window.frappe?.boot?.user?.can_create.includes("Leave Application") && (
            <Button onClick={handleAddTimeOff} label="Add time-off" iconLeft={() => <CalendarX2 />} />
          )}

          <Button variant="solid" onClick={handleAddTime} label="Add time" iconLeft={() => <Plus />} />
        </div>
        {window.frappe?.boot?.is_calendar_setup && (
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

      <div className="flex justify-between py-3.5 px-5">
        <div className="flex gap-2">
          <TextInput placeholder="Search Tasks" />
          <Select
            placeholder="Approval Status"
            className="w-fit"
            options={[
              {
                label: "Pending",
                value: "pending",
              },
              {
                label: "Not Submitted",
                value: "not-submitted",
              },
              {
                label: "Approved",
                value: "approved",
              },
              {
                label: "Rejected",
                value: "rejected",
              },
            ]}
          />
        </div>
        <div className="flex gap-2">
            
        <Filter
          fields={sampleFields}
          value={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
          }}
        />
        <Button icon={()=><Ellipsis size={16}/>}/>

        </div>
      </div>

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
                  Object.entries(timesheet.data?.data).map(([key, value]: [string, timesheet], index) => {
                    return (
                      <div
                        key={key}
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
                          showHeading={index === 0}
                          loadingLikedTasks={loadingLikedTasks}
                          likedTaskData={likedTaskData}
                          getLikedTaskData={getLikedTaskData}
                          onButtonClick={() => handleApproval(value.start_date, value.end_date)}
                        />
                      </div>
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
