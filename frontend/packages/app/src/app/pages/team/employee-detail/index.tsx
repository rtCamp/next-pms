/**
 * External dependencies
 */
import { useCallback, useEffect, useReducer } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Typography,
} from "@next-pms/design-system/components";
import { getFormatedDate, getTodayDate, getUTCDateTime } from "@next-pms/design-system/date";
import { useToast } from "@next-pms/design-system/hooks";
import { useQueryParam } from "@next-pms/hooks";
import { addDays } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Plus } from "lucide-react";
/**
 * Internal dependencies
 */
import { Main } from "@/app/layout/root";
import { InfiniteScroll } from "@/app/pages/resource_management/components/infiniteScroll";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { initialState, reducer } from "../reducer";
import { validateDate } from "../utils";
import EmployeeTimesheetList from "./employee-timesheet-list";
import { EmployeeTimesheet } from "./employeeTimesheet";
import { EmployeeDetailHeader } from "./header";

/**
 * EmployeeDetail component
 *
 * This component displays employee's timesheets in grid as well as list formate.
 *
 * @returns {JSX.Element} The rendered EmployeeDetail component.
 */
const EmployeeDetail = (): JSX.Element => {
  const { id } = useParams();
  const [teamState, dispatch] = useReducer(reducer, initialState);

  const [startDateParam, setstartDateParam] = useQueryParam<string>("date", "");
  const { toast } = useToast();

  useEffect(() => {
    if (!id) {
      const EMPLOYEE_ID_NOT_FOUND = "Please select an employee.";
      toast({
        variant: "destructive",
        description: EMPLOYEE_ID_NOT_FOUND,
      });
    }
  }, [id, toast]);

  useEffect(() => {
    dispatch({ type: "RESET_TIMESHEET_DATA_STATE" });
    const date = getTodayDate();
    dispatch({ type: "SET_EMPLOYEE_WEEK_DATE", payload: date });
    dispatch({ type: "SET_EMPLOYEE", payload: id as string });
  }, [id]);

  useEffect(() => {
    if (Object.keys(teamState.timesheetData.data).length == 0) return;
    if (!validateDate(startDateParam, teamState)) {
      const obj = teamState.timesheetData.data;
      const info = obj[Object.keys(obj).pop()!];
      const date = getFormatedDate(addDays(info.start_date, -1));
      dispatch({ type: "SET_EMPLOYEE_WEEK_DATE", payload: date });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDateParam, teamState.timesheetData.data]);

  const { data, isLoading, error, mutate } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    {
      employee: id,
      start_date: teamState.employeeWeekDate,
      max_week: 4,
    },
    undefined,
    {
      errorRetryCount: 1,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  useEffect(() => {
    if (data) {
      if (teamState.timesheetData.data && Object.keys(teamState.timesheetData.data).length > 0) {
        dispatch({ type: "UPDATE_TIMESHEET_DATA", payload: data.message });
      } else {
        dispatch({ type: "SET_TIMESHEET_DATA", payload: data.message });
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

  const handleAddTime = useCallback(() => {
    const timesheet = {
      name: "",
      task: "",
      date: getFormatedDate(getUTCDateTime()),
      description: "",
      hours: 0,
      isUpdate: false,
    };
    dispatch({ type: "SET_TIMESHEET", payload: { timesheet, id } });
    dispatch({ type: "SET_DIALOG", payload: true });
  }, [dispatch, id]);

  const handleLoadData = () => {
    if (teamState.timesheetData.data == undefined || Object.keys(teamState.timesheetData.data).length == 0) return;
    const lastKey = Object.keys(teamState.timesheetData.data).pop();
    if (!lastKey) return;
    const obj = teamState.timesheetData.data[lastKey];
    setstartDateParam("");
    const date = getFormatedDate(addDays(obj.start_date, -1));
    dispatch({ type: "SET_EMPLOYEE_WEEK_DATE", payload: date });
  };

  return (
    <>
      <EmployeeDetailHeader state={teamState} dispatch={dispatch} callback={mutate} employeeId={id as string} />
      <Main className="w-full h-full overflow-y-auto">
        <Tabs defaultValue="timesheet" className="relative">
          <div className="flex gap-x-4 pt-3 px-0 sticky top-0 z-10 transition-shadow duration-300 backdrop-blur-sm bg-background">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
              <TabsTrigger value="time">Time</TabsTrigger>
            </TabsList>
            <Button title="Add Time" className="float-right mb-1 px-3" onClick={handleAddTime}>
              <Plus /> Time
            </Button>
          </div>

          {isLoading && Object.keys(teamState.timesheetData.data).length == 0 ? (
            <Spinner isFull />
          ) : (
            <>
              {Object.keys(teamState.timesheetData.data).length == 0 ? (
                <Typography className="flex items-center justify-center">No Data</Typography>
              ) : (
                <InfiniteScroll
                  isLoading={isLoading}
                  hasMore={true}
                  verticalLodMore={handleLoadData}
                  className="w-full"
                >
                  <TabsContent value="timesheet" className="mt-0 ">
                    <EmployeeTimesheet
                      teamState={teamState}
                      dispatch={dispatch}
                      startDateParam={startDateParam}
                      setStartDateParam={setstartDateParam}
                    />
                  </TabsContent>
                  <TabsContent value="time" className="mt-0 ">
                    <EmployeeTimesheetList
                      teamState={teamState}
                      dispatch={dispatch}
                      callback={mutate}
                      startDateParam={startDateParam}
                      setStartDateParam={setstartDateParam}
                    />
                  </TabsContent>
                </InfiniteScroll>
              )}
            </>
          )}
        </Tabs>
      </Main>
    </>
  );
};

export default EmployeeDetail;
