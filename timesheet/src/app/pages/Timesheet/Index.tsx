import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getTimesheet } from "@/app/api/timesheet";
import { TimesheetTable } from "@/app/pages/Timesheet/TimesheetTable";
import { getEmployee } from "@/app/api";
import { getTodayDate } from "@/app/lib/utils";
function Timesheet() {
  const employee = getEmployee();

  const data = getTimesheet({
    employee: employee,
    start_date: getTodayDate(),
    max_weeks: 4,
  });

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
                <TimesheetTable data={value} />
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
    </div>
  );
}

export default Timesheet;
