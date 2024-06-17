import { addDays, getTodayDate } from "@/app/lib/utils";
import { ScreenLoader } from "@/app/components/Loader";
import { useContext, useEffect, useReducer } from "react";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { TimesheetTable } from "@/app/pages/Timesheet/components/Table";
import { RootState } from "@/app/state/store";
import { useSelector } from "react-redux";
import { useToast } from "@/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/app/lib/utils";
import { CircleCheck } from "lucide-react";
import ApprovalDialog from "./components/ApprovalDialog";
import { getInitialState, reducer } from "@/app/reducer/timesheet";
import { TaskCellClickProps } from "@/app/types/timesheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDown } from "@/app/components/Icon";
import { AddTimeDialog } from "./components/AddTimeDialog";
import { Typography } from "@/app/components/Typography";
import { ScrollArea } from "@/components/ui/scroll-area"

function Timesheet() {
  const { toast } = useToast();
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const employee = useSelector((state: RootState) => state.employee);
  const [state, dispatch] = useReducer(reducer, getInitialState);

  function fetchData(employee: string, append: boolean = false) {
    call
      .post("timesheet_enhancer.api.timesheet.get_timesheet_data", {
        employee: employee,
        start_date: state.weekDate,
        max_weeks: 4,
      })
      .then((res) => {
        if (append) {
          dispatch({ type: "AppendData", payload: res.message });
        } else {
          dispatch({ type: "SetData", payload: res.message });
        }
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err._server_messages);
        dispatch({ type: "SetFetching", payload: false });
        toast({
          variant: "destructive",
          title: "Error! Something went wrong.",
          description: error.message ?? error,
        });
      });
  }
  const init = (append: boolean = false) => {
    dispatch({ type: "SetFetching", payload: true });
    fetchData(employee.value, append);
    dispatch({ type: "SetFetching", payload: false });
  };
  const updateWeekDate = () => {
    const stateData = state.data;
    if (!stateData) return;
    // @ts-ignore
    const data = stateData[Object.keys(stateData).pop()];
    dispatch({ type: "SetWeekDate", payload: addDays(data.start_date, -1) });
  };

  useEffect(() => {
    if (!state.isFetchAgain) return;
    dispatch({ type: "SetFetching", payload: true });
    fetchData(employee.value);
    dispatch({ type: "SetFetching", payload: false });
    dispatch({ type: "SetFetchAgain", payload: false });
  }, [state.isFetchAgain]);

  useEffect(() => {
    init(true);
  }, [state.weekDate]);

  const onTaskCellClick = ({
    date,
    name,
    parent,
    task,
    description,
    hours,
  }: TaskCellClickProps) => {
    const isUpdate = name ? true : false;
    console.log(date, name, parent, task, description, hours);
    dispatch({
      type: "SetTimesheet",
      payload: { name, parent, task, date, description, hours, isUpdate },
    });
    dispatch({ type: "SetAddTimeDialog", payload: true });
  };

  const onAddTimeClick = () => {
    dispatch({
      type: "SetTimesheet",
      payload: {
        date: getTodayDate(),
        isUpdate: false,
        hours: 0,
        description: "",
        name: "",
        parent: "",
        task: "",
      },
    });
    dispatch({ type: "SetAddTimeDialog", payload: true });
  };

  const onApproveTimeClick = (tableRef: any) => {
    dispatch({
      type: "SetDateRange",
      payload: {
        start_date:
          // @ts-ignore
          tableRef?.current?.getAttribute("data-start-date"),
        // @ts-ignore
        end_date: tableRef?.current?.getAttribute("data-end-date"),
      },
    });
    dispatch({ type: "SetApprovalDialog", payload: true });
  };

  if (state.isFetching) {
    return <ScreenLoader isFullPage={true} />;
  }
  return (
    <div>
      <Tabs defaultValue="timesheet">
        <div className="flex gap-x-2.5 z-10">
          <TabsList className="justify-start w-full  py-0 bg-primary ">
            <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
          </TabsList>
          <Button variant="accent" onClick={onAddTimeClick}>
            Add Time
          </Button>
        </div>
        <ScrollArea  style={{ height: "calc(100vh - 8rem)" }}>
        <TabsContent value="timesheet">
          {state.data &&
            Object.entries(state.data).map(([key, value]: [string, any]) => {
              return (
                <div>
                  <div className="flex w-full h-12 justify-between items-center border-b mt-5">
                    <div className="flex gap-x-2 md:gap-x-4 items-center">
                      <Typography variant="p" className="!font-bold">
                        {key}
                      </Typography>
                    </div>
                    <div
                      className=" flex gap-x-2 text-sm pr-2 items-center"
                      onClick={() => {
                        console.log("yeah");
                      }}
                    >
                      <CircleCheck
                        size={16}
                        className="text-muted-foreground/70 "
                      />
                      <Typography
                        variant="muted"
                        className="text-muted-foreground/70"
                      >
                        Not Submitted
                      </Typography>
                    </div>
                  </div>
                  <TimesheetTable
                    data={value}
                    onTaskCellClick={onTaskCellClick}
                  />
                </div>
              );
            })}
          <Button
            variant="accent-outline"
            onClick={updateWeekDate}
            className="flex gap-x-2 my-6"
          >
            <ArrowDown />
            <Typography variant="p" className="!font-medium">
              Load More
            </Typography>
          </Button>
          </TabsContent>
          </ScrollArea>
      </Tabs>

      {state.isAddTimeDialogOpen && (
        <AddTimeDialog state={state} dispatch={dispatch} />
      )}
      {/* {state.isAprrovalDialogOpen && (
        <ApprovalDialog dialogState={state} dispatch={dispatch} />
      )} */}
    </div>
  );
}

export default Timesheet;
