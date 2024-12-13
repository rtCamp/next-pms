import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { setApprovalDialog, setDateRange } from "@/store/timesheet";
import { useToast } from "@/app/components/ui/use-toast";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { useForm } from "react-hook-form";
import { TimesheetApprovalSchema } from "@/schema/timesheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseFrappeErrorMsg, prettyDate } from "@/lib/utils";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/app/components/ui/form";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { LoaderCircle, Send } from "lucide-react";
import { useState } from "react";
import { ComboxBox } from "@/app/components/comboBox";

export const Approval = ({ onClose }: { onClose: () => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timesheetState = useSelector((state: RootState) => state.timesheet);
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { call } = useFrappePostCall("next_pms.timesheet.api.timesheet.submit_for_approval");
  const { data } = useFrappeGetCall("next_pms.timesheet.api.get_employee_with_role", {
    role: ["Projects Manager", "Projects User"],
  });
  const form = useForm<z.infer<typeof TimesheetApprovalSchema>>({
    resolver: zodResolver(TimesheetApprovalSchema),
    defaultValues: {
      start_date: timesheetState.dateRange.start_date,
      end_date: timesheetState.dateRange.end_date,
      employee: user.employee,
      approver: user.reportsTo,
      notes: "",
    },
    mode: "onSubmit",
  });

  const handleOpen = () => {
    if (isSubmitting) return;
    form.reset();
    const data = { start_date: "", end_date: "" };
    dispatch(setDateRange(data));
    dispatch(setApprovalDialog(false));
    onClose();
  };
  const handleSubmit = (data: z.infer<typeof TimesheetApprovalSchema>) => {
    setIsSubmitting(true);
    call(data)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        setIsSubmitting(false);
        handleOpen();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
        setIsSubmitting(false);
      });
  };
  return (
    <Dialog open={timesheetState.isAprrovalDialogOpen} onOpenChange={handleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {`Week of ${prettyDate(timesheetState.dateRange.start_date).date} -
             ${prettyDate(timesheetState.dateRange.end_date).date}`}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="font-normal">Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a note"
                      rows={4}
                      className="w-full placeholder:text-slate-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="approver"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="w-full flex items-center gap-x-2 mt-2">
                      <FormLabel className="font-normal">Send To</FormLabel>
                      <ComboxBox
                        label="Select an Approver"
                        className="max-w-48"
                        value={[field.value]}
                        onSelect={(value) => {
                          form.setValue("approver", value[0]);
                        }}
                        data={data?.message?.map((item: { name: string; employee_name: string }) => ({
                          value: item.name,
                          label: item.employee_name,
                        }))}
                        shouldFilter
                        showSelected
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-start mt-6">
              <Button disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Send />}
                Submit For Approval
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
