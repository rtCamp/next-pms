import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { DialogProps } from "@/app/types/timesheet";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { parseFrappeErrorMsg, formatDate } from "@/app/lib/utils";
import { useFrappePostCall } from "frappe-react-sdk";
import { useState } from "react";

export default function ApprovalDialog({ state, dispatch }: DialogProps) {
  const { call } = useFrappePostCall(
    "timesheet_enhancer.api.timesheet.submit_for_approval"
  );
  const [isOpen, setIsOpen] = useState(state.isAprrovalDialogOpen);
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
      start_date: state.dateRange.start_date,
      end_date: state.dateRange.end_date,
    },
  });

  function closeDialog() {
    dispatch({
      type: "SetDateRange",
      payload: {
        start_date: "",
        end_date: "",
      },
    });
    setIsOpen(false);
    setTimeout(() => {
      dispatch({ type: "SetApprovalDialog", payload: false });
    }, 500);
  }
  function onSubmit(values: z.infer<typeof FormSchema>) {
    call({
      start_date: values.start_date,
      end_date: values.end_date,
      notes: values.note,
    })
      .then((res) => {
        toast({
          variant: "success",
          title: res.message,
        });
        closeDialog();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          title: error,
        });
      });
  }
  return (
    <Sheet open={isOpen} onOpenChange={closeDialog}>
      <SheetContent className="sm:max-w-xl px-11 py-6">
        <SheetHeader>
          <SheetTitle className="font-bold">
            {" "}
            Week of {formatDate(state.dateRange.start_date).date} -{" "}
            {formatDate(state.dateRange.end_date).date}{" "}
          </SheetTitle>
        </SheetHeader>
        <Separator className="my-6" />
        <div className="my-6">
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Notes..."
                        rows={5}
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
              <SheetFooter className="py-6 sm:justify-start gap-x-6">
                <Button type="submit" variant="accent">
                  Submit for Approval
                </Button>
                <Button variant="ghost" type="button" onClick={closeDialog}>
                  Cancel
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
