/**
 * External dependencies.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  ApprovalStatusLabelMap,
  ApprovalStatusType,
  Spinner,
  Typography,
} from "@next-pms/design-system/components";
import { getFormatedDate } from "@next-pms/design-system/date";

import { useQueryParam } from "@next-pms/hooks";
import {
  Button,
  FilterCondition,
  Select,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { addDays } from "date-fns";
import {
  useFrappeEventListener,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";
import { isEmpty } from "lodash";
import { Ellipsis, Key } from "lucide-react";

/**
 * Internal dependencies.
 */
import CompositeFilter from "@/components/filters/compositeFilter";
import PersonalTaskLog from "@/components/task-log/personalTaskLog";
import { useDebounce } from "@/hooks/useDebounce";
import { NUMBER_OF_WEEKS_TO_FETCH } from "@/lib/constant";
import buildCompositeFilters, {
  parseFrappeErrorMsg,
  isDateInRange,
} from "@/lib/utils";
import { useUser } from "@/providers/user";
import type { WorkingFrequency } from "@/types";
import type { TimesheetFilters } from "@/types/timesheet";
import { InfiniteScroll } from "../../../components/infiniteScroll";
import { HeaderRow } from "../../../components/timesheet-row/components/row/headerRow";
import { PersonalTimesheetRow } from "../../../components/timesheet-row/personalTimesheetRow";
import { useTimesheetOutletContext } from "../outletContext";
import { initialState, reducer } from "../reducer";
import { validateDate } from "../utils";

function PersonalTimesheet() {
  const targetRef = useRef<HTMLDivElement>(null);
  const isFilterRequestRef = useRef(false);
  const toast = useToasts();
  const [compositeFilters, setCompositeFilters] = useState<FilterCondition[]>(
    [],
  );
  const [filters, setFilters] = useState<TimesheetFilters>({
    search: "",
  });
  const [hasMore, setHasMore] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const { handleApproval } = useTimesheetOutletContext();

  const [startDateParam, setStartDateParam] = useQueryParam<string>("date", "");
  const { employeeId } = useUser(({ state }) => ({
    employeeId: state.employeeId,
  }));
  const [timesheet, dispatch] = useReducer(reducer, initialState);
  const debouncedCompositeFilters = useDebounce(compositeFilters, 1000);

  const {
    startDate: filterStartDate,
    maxWeek,
    frappeFilters,
  } = useMemo(
    () => buildCompositeFilters(debouncedCompositeFilters),
    [debouncedCompositeFilters],
  );

  const { data, isLoading, error } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    {
      employee: employeeId,
      start_date: filterStartDate ?? timesheet.weekDate,
      max_week: maxWeek,
      search: filters.search,
      approval_status: filters.approvalStatus
        ? ApprovalStatusLabelMap[filters.approvalStatus]
        : null,
      filters: JSON.stringify(frappeFilters),
    },
  );

  const resetWeekDateForFilters = useCallback(() => {
    isFilterRequestRef.current = true;
    setHasMore(true);
    setStartDateParam("");
    dispatch({
      type: "SET_WEEK_DATE",
      payload: initialState.weekDate,
    });
  }, [dispatch, setStartDateParam]);

  const handleSearchChange = useCallback(
    (value: string) => {
      resetWeekDateForFilters();
      setFilters((prev) => ({ ...prev, search: value }));
    },
    [resetWeekDateForFilters],
  );

  const handleApprovalStatusChange = useCallback(
    (value?: string) => {
      resetWeekDateForFilters();
      setFilters((prev) => ({
        ...prev,
        approvalStatus: value as ApprovalStatusType,
      }));
    },
    [resetWeekDateForFilters],
  );

  const handleCompositeFilterChange = useCallback(
    (filters: FilterCondition[]) => {
      resetWeekDateForFilters();
      setCompositeFilters(filters);
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
      const fetchedWeekCount = Object.keys(data.message?.data ?? {}).length;
      setHasMore(fetchedWeekCount === NUMBER_OF_WEEKS_TO_FETCH);

      if (isFilterRequestRef.current) {
        dispatch({ type: "SET_DATA", payload: data.message });
      } else if (
        timesheet.data?.data &&
        Object.keys(timesheet.data?.data).length > 0
      ) {
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
  const { call: fetchLikedTask, loading: loadingLikedTasks } =
    useFrappePostCall("next_pms.timesheet.api.task.get_liked_tasks");
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
    if (!hasMore) return;

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
      <div className="flex flex-wrap gap-2 justify-between mb-3.5">
        <div className="flex gap-2">
          <TextInput
            placeholder="Search Tasks"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <Select
            placeholder="Approval Status"
            className="w-fit"
            options={Object.entries(ApprovalStatusLabelMap).map(
              ([key, value]) => ({
                label: key,
                value,
              }),
            )}
            value={filters.approvalStatus}
            onChange={(value) => handleApprovalStatusChange(value)}
          />
        </div>
        <div className="flex gap-2">
          <CompositeFilter
            filter={compositeFilters}
            handleFilterChange={handleCompositeFilterChange}
          />
          <Button icon={() => <Ellipsis size={16} />} />
        </div>
      </div>

      {isLoading && Object.keys(timesheet.data?.data).length == 0 ? (
        <Spinner isFull />
      ) : (
        <>
          {selectedTask && (
            <PersonalTaskLog
              task={selectedTask}
              open={!!selectedTask}
              onOpenChange={(open: boolean) => {
                if (!open) {
                  setSelectedTask(null);
                }
              }}
            />
          )}

          {Object.keys(timesheet.data?.data).length == 0 ? (
            <Typography className="flex justify-center items-center">
              No Data
            </Typography>
          ) : (
            <InfiniteScroll
              isLoading={isLoading}
              hasMore={hasMore}
              verticalLodMore={loadData}
              className="w-full h-full overflow-auto scrollbar [scrollbar-gutter:stable]"
              count={NUMBER_OF_WEEKS_TO_FETCH}
            >
              <div className="min-w-225">
                {timesheet.data?.data &&
                  Object.keys(timesheet.data?.data).length > 0 &&
                  timesheet.data?.data &&
                  Object.entries(timesheet.data?.data).map(
                    ([key, value], index) => {
                      return (
                        <>
                          {index === 0 ? (
                            <div className="sticky top-0 z-10 mb-4 bg-surface-white">
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
                            <PersonalTimesheetRow
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
                              disabled={value.status === "Approved"}
                              loadingLikedTasks={loadingLikedTasks}
                              likedTaskData={likedTaskData}
                              getLikedTaskData={getLikedTaskData}
                              setSelectedTask={setSelectedTask}
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
                    },
                  )}
              </div>
            </InfiniteScroll>
          )}
        </>
      )}
    </div>
  );
}

export default PersonalTimesheet;
