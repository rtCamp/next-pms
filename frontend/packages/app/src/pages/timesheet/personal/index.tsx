/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { RowStatus, RowStatusLabel, Spinner, statusLabelMap, Typography } from "@next-pms/design-system/components";
import { getFormatedDate } from "@next-pms/design-system/date";

import { useQueryParam } from "@next-pms/hooks";
import {
  Button,
  TextInput,
  Select,
  Filter,
  FilterCondition,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { addDays } from "date-fns";
import {
  useFrappeEventListener,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";
import { isEmpty } from "lodash";
import { Ellipsis } from "lucide-react";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg, isDateInRange } from "@/lib/utils";
import { useUser } from "@/providers/user";
import type { RootState } from "@/store";
import type { WorkingFrequency } from "@/types";
import type { NewTimesheetProps, timesheet } from "@/types/timesheet";
import { InfiniteScroll } from "../../../components/infiniteScroll";
import { TimesheetRow } from "../../../components/timesheet-row";
import { HeaderRow } from "../../../components/timesheet-row/components/row/headerRow";
import { sampleFields } from "../constants";
import { useTimesheetOutletContext } from "../outletContext";
import { initialState, reducer } from "../reducer";
import { validateDate } from "../utils";

const NUMBER_OF_WEEKS_TO_FETCH = 4;

function Timesheet() {
  const targetRef = useRef<HTMLDivElement>(null);
  const isFilterRequestRef = useRef(false);
  const toast = useToasts();
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [search, setSearch] = useState("");
  const [approvalStatus, setApprovalStatus] = useState<RowStatusLabel | "all" | null>(null);

  const { handleApproval } = useTimesheetOutletContext();

  const [startDateParam, setStartDateParam] = useQueryParam<string>("date", "");
  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));
  const [timesheet, dispatch] = useReducer(reducer, initialState);
  const { data, isLoading, error } = useFrappeGetCall("next_pms.timesheet.api.timesheet.get_timesheet_data", {
    employee: employeeId,
    start_date: timesheet.weekDate,
    max_week: NUMBER_OF_WEEKS_TO_FETCH,
    search,
    approval_status: approvalStatus,
  });

  const resetWeekDateForFilters = useCallback(() => {
    isFilterRequestRef.current = true;
    setStartDateParam("");
    dispatch({
      type: "SET_WEEK_DATE",
      payload: initialState.weekDate,
    });
  }, [dispatch, setStartDateParam]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      resetWeekDateForFilters();
      setSearch(e.target.value);
    },
    [resetWeekDateForFilters],
  );

  const handleApprovalStatusChange = useCallback(
    (value: string | undefined) => {
      resetWeekDateForFilters();
      setApprovalStatus(value && value !== "all" ? statusLabelMap[value as RowStatus] : null);
    },
    [resetWeekDateForFilters],
  );

  useEffect(() => {
    const scrollToElement = () => {
      if (targetRef.current) {
        targetRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    };
    const observer = new MutationObserver(scrollToElement);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (data) {
      if (isFilterRequestRef.current) {
        dispatch({ type: "SET_DATA", payload: data.message });
      } else if (timesheet.data?.data && Object.keys(timesheet.data?.data).length > 0) {
        dispatch({ type: "APPEND_DATA", payload: data.message });
      } else {
        dispatch({ type: "SET_DATA", payload: data.message });
      }

      isFilterRequestRef.current = false;
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast.error(err);
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
      dispatch({
        type: "SET_WEEK_DATE",
        payload: getFormatedDate(addDays(info.start_date, -1)),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, startDateParam, timesheet.data.data, validateDate]);

  useFrappeEventListener(`timesheet_update::${employeeId}`, (payload) => {
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

  const loadData = () => {
    const data = timesheet.data.data;
    if (Object.keys(data).length === 0) return;

    const lastKey = Object.keys(data).pop();
    if (!lastKey) return;
    const obj = data[lastKey];
    setStartDateParam("");
    dispatch({
      type: "SET_WEEK_DATE",
      payload: getFormatedDate(addDays(obj.start_date, -1)),
    });
  };

  return (
    <div className="w-full h-full py-3.5 px-3">
      <div className="flex justify-between mb-3.5">
        <div className="flex gap-2">
          <TextInput
            placeholder="Search Tasks"
            value={search}
            onChange={handleSearchChange}
          />
          <Select
            placeholder="Approval Status"
            className="w-fit"
            options={[
              {
                label: "All",
                value: "all",
              },
              {
                label: "Not Submitted",
                value: "not-submitted",
              },
              {
                label: "Approval Pending",
                value: "approval-pending",
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
            onChange={handleApprovalStatusChange}
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
          <Button icon={() => <Ellipsis size={16} />} />
        </div>
      </div>

      {isLoading && Object.keys(timesheet.data?.data).length == 0 ? (
        <Spinner isFull />
      ) : (
        <>
          {Object.keys(timesheet.data?.data).length == 0 ? (
            <Typography className="w-full h-full flex items-center justify-center">
              No Data Found
            </Typography>
          ) : (
            <InfiniteScroll
              isLoading={isLoading}
              hasMore={true}
              verticalLodMore={loadData}
              className="w-full h-full overflow-auto scrollbar [scrollbar-gutter:stable]"
              count={NUMBER_OF_WEEKS_TO_FETCH}
            >
              <div className="min-w-225">
                {timesheet.data?.data &&
                  Object.keys(timesheet.data?.data).length > 0 &&
                  timesheet.data?.data &&
                  Object.entries(timesheet.data?.data).map(([key, value], index) => {
                    return (
                      <>
                        {index === 0 ? (
                          <div className="mb-4 sticky top-0 bg-surface-white z-10">
                            <HeaderRow
                              dates={value.dates}
                              showHeading={true}
                              breadcrumbs={{
                                items: [
                                  { label: "Week", interactive: false },
                                  { label: "Project", interactive: false },
                                  { label: "Task", interactive: false },
                                ],
                                highlightLastItem: false,
                                size: "sm",
                                crumbClassName: "first:pl-0 last:pr-0",
                                className: "pl-[8px]",
                              }}
                            />
                          </div>
                        ) : null}
                        <div
                          key={key}
                          ref={
                            !isEmpty(startDateParam) &&
                            isDateInRange(
                              startDateParam,
                              value.start_date,
                              value.end_date,
                            )
                              ? targetRef
                              : null
                          }
                          className="animate-fade-in"
                        >
                          <TimesheetRow
                            label={key}
                            employee={employeeId}
                            workingHour={timesheet.data.working_hour}
                            workingFrequency={
                              timesheet.data
                                .working_frequency as WorkingFrequency
                            }
                            dates={value.dates}
                            holidays={timesheet.data.holidays}
                            leaves={timesheet.data.leaves}
                            tasks={value.tasks}
                            firstWeek={index === 0}
                            weeklyStatus={value.status}
                            disabled={value.status === "Approved"}
                            loadingLikedTasks={loadingLikedTasks}
                            likedTaskData={likedTaskData}
                            getLikedTaskData={getLikedTaskData}
                            onButtonClick={() =>
                              handleApproval(
                                value.start_date,
                                value.end_date,
                                value.total_hours,
                              )
                            }
                            status={value.status}
                          />
                        </div>
                      </>
                    );
                  })}
              </div>
            </InfiniteScroll>
          )}
        </>
      )}
    </div>
  );
}

export default Timesheet;
