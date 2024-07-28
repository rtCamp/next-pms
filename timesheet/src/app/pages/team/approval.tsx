import { useToast } from "@/app/components/ui/use-toast";
import { RootState } from "@/store";
import { useSelector, useDispatch } from "react-redux";
import { setApprovalDialog, setDateRange, setEmployee, setFetchAgain } from "@/store/team";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { parseFrappeErrorMsg, prettyDate } from "@/lib/utils";
import { Textarea } from "@/app/components/ui/textarea";
import { useState } from "react";
import { useFrappePostCall } from "frappe-react-sdk";

export const Approval = () => {
  const { toast } = useToast();
  const { call } = useFrappePostCall("timesheet_enhancer.api.team.update_timesheet_status");
  const [note, setNote] = useState("");
  const teamState = useSelector((state: RootState) => state.team);
  const dispatch = useDispatch();

  const handleOpen = () => {
    const data = { start_date: "", end_date: "" };
    dispatch(setDateRange(data));
    dispatch(setFetchAgain(true));
    dispatch(setEmployee(""));
    dispatch(setApprovalDialog(false));
  };
  const handleApproval = () => {
    const data = {
      start_date: teamState.dateRange.start_date,
      end_date: teamState.dateRange.end_date,
      notes: note,
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

  return (
    <Dialog open={teamState.isAprrovalDialogOpen} onOpenChange={handleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Week of {prettyDate(teamState.dateRange.start_date).date} -{prettyDate(teamState.dateRange.end_date).date}
          </DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Add a note"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          className="w-full placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <DialogFooter className="sm:justify-start mt-5">
          <Button onClick={handleApproval}>Approve</Button>
          <Button variant="destructive" onClick={handleOpen}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
