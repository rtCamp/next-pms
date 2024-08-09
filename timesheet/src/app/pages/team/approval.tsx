import { useToast } from "@/app/components/ui/use-toast";
import { RootState } from "@/store";
import { useSelector, useDispatch } from "react-redux";
import { setDateRange, setFetchAgain } from "@/store/team";
import { Button } from "@/app/components/ui/button";
import { parseFrappeErrorMsg, prettyDate } from "@/lib/utils";
// import { Textarea } from "@/app/components/ui/textarea";
import { useEffect, useState } from "react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/app/components/ui/sheet";
import  TimesheetTable from "@/app/components/timesheetTable";
import { Spinner } from "@/app/components/spinner";
import { timesheet } from "@/types/timesheet";
// import { Typography } from "@/app/components/typography";
import { Separator } from "@/app/components/ui/separator";

export const Approval = () => {
  const { toast } = useToast();
  // const [note, setNote] = useState("");
  const teamState = useSelector((state: RootState) => state.team);
  const [timesheetData, setTimesheetData] = useState<timesheet>();
  const dispatch = useDispatch();
  const { call } = useFrappePostCall("timesheet_enhancer.api.team.update_timesheet_status");

  const { data, isLoading, error } = useFrappeGetCall("timesheet_enhancer.api.timesheet.get_timesheet_data", {
    employee: teamState.employee,
    start_date: teamState.weekDate,
    max_week: 1,
  });
  const handleOpen = () => {
    const data = { start_date: "", end_date: "" };
    dispatch(setFetchAgain(true));
    dispatch(setDateRange({ dateRange: data, employee: "", isAprrovalDialogOpen: false }));
  };
  const handleApproval = () => {
    const data = {
      start_date: teamState.dateRange.start_date,
      end_date: teamState.dateRange.end_date,
      status: "Approved",
      employee: teamState.employee,
    };
    call(data)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        handleOpen();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };
  useEffect(() => {
    if (data) {
      setTimesheetData(data.message.data[Object.keys(data.message.data)[0]]);
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error]);

  return (
    <Sheet open={teamState.isAprrovalDialogOpen} onOpenChange={handleOpen}>
      {isLoading && <Spinner />}
      {timesheetData && (
        <SheetContent className="sm:max-w-4xl">
          <SheetHeader>
            <SheetTitle>
              Week of {prettyDate(teamState.dateRange.start_date).date} -{prettyDate(teamState.dateRange.end_date).date}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-y-8 mt-6">
            <div>
              <TimesheetTable
                dates={timesheetData.dates}
                tasks={timesheetData.tasks}
                holidays={timesheetData.holidays}
                leaves={timesheetData.leaves}
                hasHeading
                working_frequency={data.message.working_frequency}
                working_hour={data.message.working_hour}
                disabled
              />
              <Separator />
            </div>
            {/* <div className="flex flex-col gap-y-2">
              <Typography variant="p">Notes</Typography>
              <Textarea
                placeholder="Add a note"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.currentTarget.value)}
                className="w-full placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div> */}
          </div>
          <SheetFooter className="sm:justify-start mt-5 flex-col gap-y-4">
            <Button onClick={handleApproval} variant="success">
              Approve
            </Button>
            {/* <Button variant="destructive" onClick={handleOpen}>
              Reject
            </Button> */}
          </SheetFooter>
        </SheetContent>
      )}
    </Sheet>
  );
};
