import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { addDays } from "@/app/lib/utils";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardFooter } from "@/components/ui/card";

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
    init();
  }, []);

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
      <div className="flex justify-end pb-4">
        <Button onClick={onAddTimeClick}>Add Time</Button>
      </div>
      <Card>
        <Tabs defaultValue="timesheet" className="">
          <TabsList className="justify-start w-full bg-background py-0">
            <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
          </TabsList>
          <hr />

          <TabsContent value="timesheet">
            <Accordion type="multiple" className="w-full">
              {state.data &&
                Object.entries(state.data).map(
                  ([key, value]: [string, any]) => (
                    <AccordionItem
                      key={key}
                      value={key}
                      className="first:border-t"
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
                            <CircleCheck
                              size={16}
                              stroke="hsl(var(--success))"
                            />
                            <p>NOT SUBMITTED</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-0">
                        <TimesheetTable
                          data={value}
                          onTaskCellClick={onTaskCellClick}
                          onApproveTimeClick={onApproveTimeClick}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )
                )}
            </Accordion>
          </TabsContent>
        </Tabs>
        <CardFooter className="p-4">
          <Button variant="outline" onClick={updateWeekDate}>
            Load More
          </Button>
        </CardFooter>
      </Card>

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
