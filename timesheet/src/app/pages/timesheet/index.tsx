import { useToast } from "@/app/components/ui/use-toast";
import { RootState } from "@/store";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setData,
  SetAddTimeDialog,
  SetTimesheet,
  SetFetchAgain,
  SetWeekDate,
  AppendData,
  setDateRange,
  setApprovalDialog,
} from "@/store/timesheet";
import { Button } from "@/app/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { Typography } from "@/app/components/typography";
import { TimesheetTable, SubmitButton } from "@/app/components/timesheetTable";
import { parseFrappeErrorMsg, getFormatedDate } from "@/lib/utils";
import { addDays } from "date-fns";
import { Spinner } from "@/app/components/spinner";
import { AddTime } from "./addTime";
import { Approval } from "./Approval";
import { NewTimesheetProps, timesheet } from "@/types/timesheet";
import { WorkingFrequency } from "@/types";

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
      if (timesheet.data?.data && Object.keys(timesheet.data?.data).length > 0) {
        dispatch(AppendData(data.message.data));
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
  }, [data, error, timesheet.isFetchAgain]);

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

  const onCellClick = (data: NewTimesheetProps) => {
    data.employee = user.employee;
    data.isUpdate = data.hours > 0;
    dispatch(SetTimesheet(data));
    dispatch(SetAddTimeDialog(true));
  };
  const loadData = () => {
    const data = timesheet.data.data;
    if (!data) return;
    // eslint-disable-next-line
    // @ts-expect-error
    const obj = data[Object.keys(data).pop()];

    dispatch(SetWeekDate(getFormatedDate(addDays(obj.start_date, -1))));
    dispatch(SetFetchAgain(true));
  };
  const handleApproval = (start_date: string, end_date: string) => {
    const data = {
      start_date: start_date,
      end_date: end_date,
    };
    dispatch(setDateRange(data));
    dispatch(setApprovalDialog(true));
  };
  if (error) {
    return <></>;
  }
  return (
    <div className="flex flex-col">
      <div>
        <Button className="float-right mb-1" onClick={handleAddTime}>
          Add Time
        </Button>
      </div>
      {isLoading ? (
        <Spinner isFull />
      ) : (
        <div className="overflow-y-scroll" style={{ height: "calc(100vh - 8rem)" }}>
          {timesheet.data?.data &&
            Object.keys(timesheet.data?.data).length > 0 &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.entries(timesheet.data?.data).map(([key, value]: [string, timesheet]) => {
              return (
                <Accordion type="multiple" key={key} defaultValue={[key]}>
                  <AccordionItem value={key}>
                    <AccordionTrigger className="hover:no-underline w-full py-2">
                      <div className="flex justify-between items-center w-full">
                        <Typography variant="h5" className="font-medium">
                          {key} : {value.total_hours}h
                        </Typography>
                        <SubmitButton
                          start_date={value.start_date}
                          end_date={value.end_date}
                          onApproval={handleApproval}
                          status={value.status}
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <TimesheetTable
                        working_hour={timesheet.data.working_hour}
                        working_frequency={timesheet.data.working_frequency as WorkingFrequency}
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
      )}
      <div className="mt-5">
        <Button className="float-left" variant="outline" onClick={loadData}>
          Load More
        </Button>
      </div>
      {timesheet.isDialogOpen && <AddTime />}
      {timesheet.isAprrovalDialogOpen && <Approval />}
    </div>
  );
}

export default Timesheet;
