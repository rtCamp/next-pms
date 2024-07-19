import { useToast } from "@/app/components/ui/use-toast";
import { RootState } from "@/store";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setData } from "@/store/timesheet";
import { Button } from "@/app/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { Typography } from "@/app/components/typography";
import { TimesheetTable } from "@/app/components/timesheetTable";

function Timesheet() {
  const { toast } = useToast();
  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);
  const dispatch = useDispatch();

  const { data, isLoading, error, mutate } = useFrappeGetCall("timesheet_enhancer.api.timesheet.get_timesheet_data", {
    employee: user.employee,
    weekdate: timesheet.weekDate,
    max_week: 2,
  });

  useEffect(() => {
    if (data) {
      dispatch(setData(data.message));
    }
  }, [data, timesheet.weekDate]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col">
      <div>
        <Button className="float-right mb-5">Add Time</Button>
      </div>
      {Object.keys(timesheet.data).length > 0 &&
        Object.entries(timesheet.data).map(([key, value]: [string, any]) => {
          return (
            <Accordion type="multiple" key={key}>
              <AccordionItem value={key}>
                <AccordionTrigger className="hover:no-underline w-full">
                  <div className="flex justify-between w-full">
                    <Typography variant="h4" className="font-medium">
                      {key} : {value.total_hours}h
                    </Typography>
                    <Typography variant="h4" className="font-medium justify-self-end">
                      {key} : {value.total_hours}h
                    </Typography>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <TimesheetTable
                    dates={value.dates}
                    holidays={value.holidays}
                    leaves={value.leaves}
                    tasks={value.tasks}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        })}
    </div>
  );
}

export default Timesheet;
