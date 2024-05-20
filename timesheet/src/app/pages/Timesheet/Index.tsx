import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getTodayDate } from "@/app/lib/utils";
import { ScreenLoader } from "@/app/components/Loader";
import { useContext, useEffect, useState, lazy } from "react";
import { TimesheetProp } from "@/app/types/timesheet";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { TimesheetTable } from "@/app/pages/Timesheet/TimesheetTable";

const TimesheetDialog = lazy(() => import("./components/Dialog"));

function Timesheet() {
  const { call } = useContext(FrappeContext) as FrappeConfig;
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
  const [employee, setEmployee] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [timesheet, setTimesheet] = useState<TimesheetProp>(
    defaultTimesheetState
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function fetchEmployee() {
    if (!employee) {
      const res = await call.get(
        "timesheet_enhancer.api.utils.get_employee_from_user"
      );
      setEmployee(res.message);
      return res.message;
    }
    return employee;
  }

  function fetchData(employee: string) {
    call
      .post("timesheet_enhancer.api.timesheet.get_timesheet_data", {
        employee: employee,
        start_date: getTodayDate(),
        max_weeks: 4,
      })
      .then((res) => {
        setData(res);
      });
  }
  useEffect(() => {
    (async () => {
      setIsFetching(true);
      const employee = await fetchEmployee();
      fetchData(employee);
      setIsFetching(false);
    })();
  }, []);
  useEffect(() => {
    (async () => {
      if (!isFetchAgain) return;
      setIsFetching(true);
      const employee = await fetchEmployee();
      fetchData(employee);
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
                {key}
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <TimesheetTable
                  data={value}
                  openDialog={() => setIsDialogOpen(true)}
                  updateTimesheetData={updateTimesheet}
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
    </div>
  );
}

export default Timesheet;
