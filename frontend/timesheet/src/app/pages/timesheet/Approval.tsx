import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { setApprovalDialog, setDateRange, SetFetchAgain } from "@/store/timesheet";
import { useToast } from "@/app/components/ui/use-toast";
import { useFrappePostCall } from "frappe-react-sdk";
import { useForm } from "react-hook-form";
import { TimesheetApprovalSchema } from "@/schema/timesheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseFrappeErrorMsg, prettyDate } from "@/lib/utils";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/app/components/ui/form";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { LoaderCircle } from "lucide-react";

export const Approval = () => {
  const timesheetState = useSelector((state: RootState) => state.timesheet);
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { call } = useFrappePostCall("timesheet_enhancer.api.timesheet.submit_for_approval");

  const form = useForm<z.infer<typeof TimesheetApprovalSchema>>({
    resolver: zodResolver(TimesheetApprovalSchema),
    defaultValues: {
      start_date: timesheetState.dateRange.start_date,
      end_date: timesheetState.dateRange.end_date,
      employee: user.employee,
      notes: "",
    },
    mode: "onSubmit",
  });

  const handleOpen = () => {
    form.reset();
    const data = { start_date: "", end_date: "" };
    dispatch(setDateRange(data));
    dispatch(SetFetchAgain(true));
    dispatch(setApprovalDialog(false));
  };
  const handleSubmit = (data: z.infer<typeof TimesheetApprovalSchema>) => {
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
    <Dialog open={timesheetState.isAprrovalDialogOpen} onOpenChange={handleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="pb-6">
            Week of {prettyDate(timesheetState.dateRange.start_date).date} -
            {prettyDate(timesheetState.dateRange.end_date).date}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a note"
                      rows={4}
                      className="w-full placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-start mt-6">
              <Button disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <LoaderCircle className="animate-spin w-4 h-4" />}
                Submit For Approval
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
