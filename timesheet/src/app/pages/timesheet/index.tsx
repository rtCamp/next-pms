import { useToast } from "@/app/components/ui/use-toast";
import { RootState } from "@/store";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setData, SetAddTimeDialog, SetTimesheet, SetFetchAgain, SetWeekDate, AppendData } from "@/store/timesheet";
import { Button } from "@/app/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { Typography } from "@/app/components/typography";
import { TimesheetTable } from "@/app/components/timesheetTable";
import { parseFrappeErrorMsg, getFormatedDate, addDays } from "@/lib/utils";
import { Spinner } from "@/app/components/spinner";
import { AddTime } from "./addTime";
import {CircleCheck} from "lucide-react"

function Timesheet() {
  const { toast } = useToast();
  const user = useSelector((state: RootState) => state.user);
  const timesheet = useSelector((state: RootState) => state.timesheet);
  const dispatch = useDispatch();

  const { data, isLoading, error, mutate } = useFrappeGetCall("timesheet_enhancer.api.timesheet.get_timesheet_data", {
    employee: user.employee,
    start_date: timesheet.weekDate,
    max_week: 4,
  });

  useEffect(() => {
    if (timesheet.isFetchAgain) {
      mutate();
      dispatch(SetFetchAgain(false));
    }
    if (data) {
      if (timesheet.data) {
        dispatch(AppendData(data.message));
      } else {
        dispatch(setData(data.message));
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
  }, [data, timesheet.weekDate, error, timesheet.isFetchAgain]);

  const handleAddTime = () => {
    const timesheetData = {
      name: "",
      parent: "",
      task: "",
      date: getFormatedDate(new Date()),
      description: "",
      hours: 0,
      isUpdate: false,
      employee: user.employee,
    };
    dispatch(SetTimesheet(timesheetData));
    dispatch(SetAddTimeDialog(true));
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const onCellClick = (data) => {
    data.employee = user.employee;
    data.isUpdate = true;
    dispatch(SetTimesheet(data));
    dispatch(SetAddTimeDialog(true));
  };
  const loadData = () => {
    const data = timesheet.data;
    if (!data) return;
    // eslint-disable-next-line
    // @ts-expect-error
    const obj = data[Object.keys(data).pop()];

    dispatch(SetWeekDate(addDays(obj.start_date, -1)));
    dispatch(SetFetchAgain(true));
  };
  if (isLoading) return <Spinner isFull />;

  return (
    <div className="flex flex-col">
      <div>
        <Button className="float-right mb-5" onClick={handleAddTime}>
          Add Time
        </Button>
      </div>
      <div className="overflow-y-scroll" style={{ height: "calc(100vh - 14rem)" }}>
        {Object.keys(timesheet.data).length > 0 &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Object.entries(timesheet.data).map(([key, value]: [string, any], index: number) => {
            return (
              <Accordion type="multiple" key={key} defaultValue={index == 0 ? [key] : []}>
                <AccordionItem value={key}>
                  <AccordionTrigger className="hover:no-underline w-full">
                    <div className="flex justify-between w-full">
                      <Typography variant="h5" className="font-medium">
                        {key} : {value.total_hours}h
                      </Typography>
                      <SubmitButton/>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <TimesheetTable
                      dates={value.dates}
                      holidays={value.holidays}
                      leaves={value.leaves}
                      tasks={value.tasks}
                      onCellClick={onCellClick}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            );
          })}
      </div>
      <div className="mt-5">
        <Button className="float-left" variant="outline" onClick={loadData}>
          Load More
        </Button>
      </div>
      {timesheet.isDialogOpen && <AddTime />}
    </div>
  );
}


const SubmitButton = () => {
  return (
    <Button variant="ghost" className="mr-1 text-slate-400 font-normal gap-x-2">
      <CircleCheck/>
      Not Submitted
    </Button>
  );
}
export default Timesheet;
