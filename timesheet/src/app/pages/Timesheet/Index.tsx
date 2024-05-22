import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getTodayDate } from "@/app/lib/utils";
import { ScreenLoader } from "@/app/components/Loader";
import { useContext, useEffect, useState } from "react";
import { TimesheetProp } from "@/app/types/timesheet";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { TimesheetTable } from "@/app/pages/Timesheet/TimesheetTable";
import { RootState } from "@/app/state/store";
import { useSelector } from "react-redux";
import { useToast } from "@/components/ui/use-toast";
import { parseFrappeErrorMsg,floatToTime } from "@/app/lib/utils";
import TimesheetDialog from "./components/Dialog";
import { CircleCheck } from "lucide-react";
import ApprovalDialog from "./components/ApprovalDialog";

function Timesheet() {
  const { toast } = useToast();
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const employee = useSelector((state: RootState) => state.employee);

  const defaultTimesheetState = {
    name: "",
    parent: "",
    task: "",
    date: "",
    description: "",
    hours: 0,
    isUpdate: false,
  };
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchAgain, setFetchAgain] = useState(false);
  const [data, setData] = useState<any>(null);
  const [timesheet, setTimesheet] = useState<TimesheetProp>(
    defaultTimesheetState
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAprrovalDialogOpen, setIsAprrovalDialogOpen] = useState(false);

  function fetchData(employee: string) {
    call
      .post("timesheet_enhancer.api.timesheet.get_timesheet_data", {
        employee: employee,
        start_date: getTodayDate(),
        max_weeks: 4,
      })
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err._server_messages);
        setIsFetching(false);
        toast({
          variant: "destructive",
          title: "Error! Something went wrong.",
          description: error.message ?? error,
        });
      });
  }
  useEffect(() => {
    (async () => {
      setIsFetching(true);
      fetchData(employee.value);
      setIsFetching(false);
    })();
  }, []);
  useEffect(() => {
    (async () => {
      if (!isFetchAgain) return;
      setIsFetching(true);
      fetchData(employee.value);
      setIsFetching(false);
      setFetchAgain(false);
    })();
  }, [isFetchAgain]);
  const updateTimesheet = (timesheet: TimesheetProp) => {
    setTimesheet(timesheet);
  };
  const resetTimesheet = () => {
    setTimesheet(defaultTimesheetState);
  };
  if (isFetching) {
    return <ScreenLoader isFullPage={true} />;
  }
  return (
    <div>
      <Accordion type="single" collapsible className="w-full">
        {data &&
          Object.entries(data?.message).map(([key, value]: [string, any]) => (
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
                  openDialog={() => setIsDialogOpen(true)}
                  updateTimesheetData={updateTimesheet}
                  openApprovalDialog={() => setIsAprrovalDialogOpen(true)}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
      {isDialogOpen && (
        <TimesheetDialog
          isOpen={isDialogOpen}
          timesheet={timesheet}
          setFetchAgain={setFetchAgain}
          closeDialog={() => {
            resetTimesheet();
            setIsDialogOpen(false);
          }}
        />
      )}

      {isAprrovalDialogOpen && (
        <ApprovalDialog
          isOpen={isAprrovalDialogOpen}
          closeDialog={() => {
            setIsAprrovalDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default Timesheet;
