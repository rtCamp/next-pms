import { addDays, getTodayDate } from "@/app/lib/utils";
import { ScreenLoader } from "@/app/components/Loader";
import { useContext, useEffect, useReducer } from "react";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { TimesheetTable } from "@/app/pages/Timesheet/components/Table";
import { RootState } from "@/app/state/store";
import { useSelector } from "react-redux";
import { useToast } from "@/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/app/lib/utils";
import { CircleCheck, Clock9 } from "lucide-react";
import ApprovalDialog from "./components/ApprovalDialog";
import { getInitialState, reducer } from "@/app/reducer/timesheet";
import { TaskCellClickProps } from "@/app/types/timesheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDown } from "@/app/components/Icon";
import { AddTimeDialog } from "./components/AddTimeDialog";
import { Typography } from "@/app/components/Typography";

function Timesheet() {
  const { toast } = useToast();
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const employee = useSelector((state: RootState) => state.employee);
  const [state, dispatch] = useReducer(reducer, getInitialState);
  const onSubmit = () => {
    dispatch({ type: "SetFetchAgain", payload: true });
  };
  const onClose = () => {
    dispatch({ type: "SetTimesheet", payload: getInitialState.timesheet });
    setTimeout(() => {
      dispatch({ type: "SetAddTimeDialog", payload: false });
    }, 500);
  };
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
        const error = parseFrappeErrorMsg(err);
        dispatch({ type: "SetFetching", payload: false });
        toast({
          variant: "destructive",
          title: error,
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
    employee,
  }: TaskCellClickProps) => {
    const isUpdate = name ? true : false;

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

  const onApproveTimeClick = (date: Array<string>) => {
    dispatch({
      type: "SetDateRange",
      payload: {
        start_date: date.at(0),
        end_date: date.at(-1),
      },
    });
    dispatch({ type: "SetApprovalDialog", payload: true });
  };

  if (state.isFetching) {
    return <ScreenLoader isFullPage={true} />;
  }
  return (
    <>
      {Object.keys(state.data).length > 0 ? (
        <>
          <Tabs defaultValue="timesheet">
            <div className="flex gap-x-2.5 z-10 w-full ">
              <TabsList className="justify-start  py-0  w-full">
                <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
              </TabsList>
              <Button onClick={onAddTimeClick}>Add Time</Button>
            </div>

            <TabsContent
              value="timesheet"
              style={{ height: "calc(100vh - 8rem)" }}
              className="overflow-y-auto no-scrollbar"
            >
              {Object.entries(state.data).map(([key, value]: [string, any]) => {
                return (
                  <>
                    <div className="flex w-full h-12 justify-between items-center border-b mt-5">
                      <div className="flex gap-x-2 md:gap-x-4 items-center">
                        <Typography variant="p" className="!font-bold">
                          {key}
                        </Typography>
                      </div>
                      <div
                        className=" flex gap-x-2 text-sm pr-2 items-center p-2 hover: rounded-sm hover:cursor-pointer"
                        onClick={() =>
                          value.state == "open"
                            ? onApproveTimeClick(value.dates)
                            : null
                        }
                      >
                        <Status status={value.state} />
                      </div>
                    </div>

                    <TimesheetTable
                      data={value}
                      onTaskCellClick={onTaskCellClick}
                    />
                  </>
                );
              })}
              <Button onClick={updateWeekDate} className="flex gap-x-2 my-6 group" variant="outline">
                <ArrowDown className="stroke-black group-hover:stroke-white" />
                <Typography variant="p" className="!font-medium">
                  Load More
                </Typography>
              </Button>
            </TabsContent>
          </Tabs>

          {state.isDialogOpen && (
            <AddTimeDialog
              state={state}
              submitAction={onSubmit}
              closeAction={onClose}
            />
          )}
          {state.isAprrovalDialogOpen && (
            <ApprovalDialog state={state} dispatch={dispatch} />
          )}
        </>
      ) : (
        <></>
      )}
    </>
  );
}

export default Timesheet;

function Status({ status }: { status: string }) {
  if (status == "submitted") {
    return (
      <>
        <Clock9 size={16} stroke="#F2994A" />
        <Typography variant="muted">Submitted</Typography>
      </>
    );
  } else if (status == "approved") {
    return (
      <>
        <CircleCheck size={16} fill="#58C900" stroke="#fff" />
        <Typography variant="muted">Approved</Typography>
      </>
    );
  } else {
    return (
      <>
        <CircleCheck size={16} className="text-muted-foreground/70 " />
        <Typography variant="muted" className="text-muted-foreground/70">
          Not Submitted
        </Typography>
      </>
    );
  }
}
