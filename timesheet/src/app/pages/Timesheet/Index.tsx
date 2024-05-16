import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useFetchTimesheet } from "@/app/api/timesheet";
import { TimesheetTable } from "@/app/pages/Timesheet/TimesheetTable";
import { getTodayDate, useEmployeeData } from "@/app/lib/utils";
import { ScreenLoader } from "@/app/components/Loader";
import { TimesheetDialog } from "./components/Dialog";
import { useState } from "react";
import { TimesheetProp } from "@/app/types/timesheet";

function Timesheet() {
  const defaultTimesheetState = {
    name: "",
    parent: "",
    task: "",
    date: "",
    description: "",
    hours: 0,
    isUpdate: false,
  };
  const [timesheet, setTimesheet] = useState<TimesheetProp>(
    defaultTimesheetState
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const employee = useEmployeeData();
  if (!employee) {
    return <ScreenLoader isFullPage={true} />;
  }
  const { isLoading, data, error } = useFetchTimesheet({
    employee: employee,
    start_date: getTodayDate(),
    max_weeks: 4,
  });
  if (!data || isLoading) {
    return <ScreenLoader isFullPage={true} />;
  }

  const updateTimesheet = (timesheet: TimesheetProp) => {
    setTimesheet(timesheet);
  };
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
          closeDialog={() => {
            setIsDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default Timesheet;
