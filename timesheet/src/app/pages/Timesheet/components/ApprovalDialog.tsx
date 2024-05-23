import {
  Dialog,
  CustomDialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { dateRangeProps } from "@/app/types/timesheet";
import { useToast } from "@/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/app/lib/utils";
import {  useFrappePostCall } from "frappe-react-sdk";
export default function ApprovalDialog({
  isOpen,
  dateRange,
  closeDialog,
}: {
  isOpen: boolean;
  dateRange: dateRangeProps;
  closeDialog: () => void;
}) {
  const { call } = useFrappePostCall(
    "timesheet_enhancer.api.timesheet.submit_for_approval"
  );
  const { toast } = useToast();
  const FormSchema = z.object({
    note: z.string({}),
    start_date: z.string({}),
    end_date: z.string({}),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      note: "",
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
    },
  });
  function onSubmit(values: z.infer<typeof FormSchema>) {
    call({
      start_date: values.start_date,
      end_date: values.end_date,
      notes: values.note,
    })
      .then((res) => {
        toast({
          variant: "success",
          title: "Success!",
          description: "Timesheet submitted for approval.",
        });
        closeDialog();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(
          err._server_messages ?? err._debug_message
        );
        toast({
          variant: "destructive",
          title: "Error! Something went wrong.",
          description: err._error_message ?? error.message ,
        });
      });
  }
  return (
    <Dialog open={isOpen}>
      <CustomDialogContent
        className="sm:max-w-md timesheet-dialog"
        isCloseButton={true}
        closeAction={closeDialog}
      >
        <div className="pt-8">
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Notes..."
                        {...field}
                        onChange={(event) => {
                          field.onChange(event.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Submit for Approval</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
}
