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
import { TimesheetTable } from "@/app/components/timesheetTable";
import { parseFrappeErrorMsg, getFormatedDate } from "@/lib/utils";
import { addDays } from "date-fns";
import { Spinner } from "@/app/components/spinner";
import { AddTime } from "./addTime";
import { CircleCheck, CircleX, Clock3 } from "lucide-react";
import { Approval } from "./Approval";

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

const SubmitButton = ({
  start_date,
  end_date,
  onApproval,
  status,
}: {
  start_date: string;
  end_date: string;
  onApproval: (start_date: string, end_date: string) => void;
  status: string;
}) => {
  const handleClick = () => {
    onApproval(start_date, end_date);
  };
  if (status == "Approved") {
    return (
      <Button variant="ghost" className="mr-1 text-primary bg-green-50 font-normal gap-x-2">
        <CircleCheck className="stroke-success" />
        {status}
      </Button>
    );
  } else if (status == "Rejected") {
    return (
      <Button variant="ghost" className="mr-1 text-primary bg-red-50 font-normal gap-x-2">
        <CircleX className="stroke-destructive" />
        {status}
      </Button>
    );
  } else if (status == "Approval Pending") {
    return (
      <Button variant="ghost" className="mr-1 text-primary bg-orange-50 font-normal gap-x-2" onClick={handleClick}>
        <Clock3 className="stroke-warning" />
        {status}
      </Button>
    );
  } else {
    return (
      <Button variant="ghost" className="mr-1 font-normal text-slate-400 gap-x-2" onClick={handleClick}>
        <CircleCheck />
        {status}
      </Button>
    );
  }
};
export default Timesheet;
