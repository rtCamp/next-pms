import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getTodayDate } from "@/app/lib/utils";
import { ScreenLoader } from "@/app/components/Loader";
import { useContext, useEffect, useReducer } from "react";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { TimesheetTable } from "@/app/pages/Timesheet/TimesheetTable";
import { RootState } from "@/app/state/store";
import { useSelector } from "react-redux";
import { useToast } from "@/components/ui/use-toast";
import { parseFrappeErrorMsg, floatToTime } from "@/app/lib/utils";
import TimesheetDialog from "./components/Dialog";
import { CircleCheck } from "lucide-react";
import ApprovalDialog from "./components/ApprovalDialog";
import { getInitialState, reducer } from "@/app/reducer/timesheet";
import { TaskCellClickProps } from "@/app/types/timesheet";

function Timesheet() {
  const { toast } = useToast();
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const employee = useSelector((state: RootState) => state.employee);
  const [state, dispatch] = useReducer(reducer, getInitialState);

  function fetchData(employee: string) {
    call
      .post("timesheet_enhancer.api.timesheet.get_timesheet_data", {
        employee: employee,
        start_date: getTodayDate(),
        max_weeks: 4,
      })
      .then((res) => {
        dispatch({ type: "SetData", payload: res });
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
  useEffect(() => {
    (async () => {
      dispatch({ type: "SetFetching", payload: true });
      fetchData(employee.value);
      dispatch({ type: "SetFetching", payload: false });
    })();
  }, []);
  useEffect(() => {
    (async () => {
      if (!state.isFetchAgain) return;
      dispatch({ type: "SetFetching", payload: true });
      fetchData(employee.value);
      dispatch({ type: "SetFetching", payload: false });
      dispatch({ type: "SetFetchAgain", payload: false });
    })();
  }, [state.isFetchAgain]);

  const onTaskCellClick = ({
    date,
    name,
    parent,
    task,
    description,
    hours,
  }: TaskCellClickProps) => {
    const isUpdate = name ? true : false;
    dispatch({
      type: "SetTimesheet",
      payload: { name, parent, task, date, description, hours, isUpdate },
    });
    dispatch({ type: "SetDialog", payload: true });
  };

  const onAddTimeClick = () => {
    dispatch({ type: "SetDialog", payload: true });
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
      <Accordion type="single" collapsible className="w-full">
        {state.data &&
          Object.entries(state.data?.message).map(
            ([key, value]: [string, any]) => (
              <AccordionItem
                key={key}
                value={key}
                className="border-r border-t border-l"
              >
                <AccordionTrigger className="bg-background hover:no-underline focus:outline-none hover:border-transparent focus:outline-offset-0 focus:outline-0">
                  <div className="flex w-full justify-between items-center text-xs sm:text-sm md:text-base">
                    <div className="flex gap-x-2 md:gap-x-4 items-center">
                      <p>{key}</p>
                      <p className="text-muted-foreground ">
                        {floatToTime(value?.total_hours)}h
                      </p>
                    </div>
                    <div
                      className=" flex text-muted-foreground/70 gap-x-2 text-sm pr-2 items-center"
                      onClick={() => {
                        console.log("yeah");
                      }}
                    >
                      <CircleCheck size={16} stroke="hsl(var(--success))" />
                      <p>NOT SUBMITTED</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <TimesheetTable
                    data={value}
                    onTaskCellClick={onTaskCellClick}
                    onAddTimeClick={onAddTimeClick}
                    onApproveTimeClick={onApproveTimeClick}
                  />
                </AccordionContent>
              </AccordionItem>
            )
          )}
      </Accordion>
      {state.isDialogOpen && (
        <TimesheetDialog dialogState={state} dispatch={dispatch} />
      )}

      {state.isAprrovalDialogOpen && (
        <ApprovalDialog dialogState={state} dispatch={dispatch} />
      )}
    </div>
  );
}

export default Timesheet;
