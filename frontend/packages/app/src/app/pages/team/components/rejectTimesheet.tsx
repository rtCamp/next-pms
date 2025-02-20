/**
 * External dependencies
 */
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogTrigger,
  Button,
  DialogContent,
  DialogTitle,
  Typography,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  TextArea,
  FormMessage,
  DialogFooter,
} from "@next-pms/design-system/components";
import { prettyDate } from "@next-pms/design-system/date";
import { useToast } from "@next-pms/design-system/hooks";
import { useFrappePostCall } from "frappe-react-sdk";
import { X, LoaderCircle } from "lucide-react";
import { z } from "zod";

/**
 * Internal dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { TimesheetRejectionSchema } from "@/schema/timesheet";

type TimesheetRejectionProps = {
  onRejection: () => void;
  dates: Array<string>;
  employee: string;
  disabled: boolean;
  isRejecting: boolean;
  setIsRejecting: React.Dispatch<React.SetStateAction<boolean>>;
};

export const RejectTimesheet = ({
  onRejection,
  dates,
  employee,
  disabled,
  isRejecting,
  setIsRejecting,
}: TimesheetRejectionProps) => {
  const { call } = useFrappePostCall("next_pms.timesheet.api.team.approve_or_reject_timesheet");
  const { toast } = useToast();
  const form = useForm<z.infer<typeof TimesheetRejectionSchema>>({
    resolver: zodResolver(TimesheetRejectionSchema),
    defaultValues: {
      note: "",
      employee: employee,
      dates: dates,
    },
    mode: "onSubmit",
  });
  const handleSubmit = (data: z.infer<typeof TimesheetRejectionSchema>) => {
    setIsRejecting(true);
    const payload = {
      dates: dates,
      status: "Rejected",
      employee: employee,
      note: data.note,
    };
    call(payload)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        setIsRejecting(false);
        onRejection();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
        setIsRejecting(false);
      });
  };

  useEffect(() => {
    if (dates.length > 0) {
      form.setValue("dates", dates as [string, ...string[]]);
    }
  }, [dates, form]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" disabled={disabled}>
          <X />
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Reject timesheet</DialogTitle>
        <div>
          <Typography variant="p">The following day's timesheet will be rejected</Typography>
          <ol className="list-disc pl-6">
            {dates.map((date: string, index: number) => {
              return (
                <li key={index} className="text-sm">
                  {prettyDate(date).date}
                </li>
              );
            })}
          </ol>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="note">Please add reason for rejection.</FormLabel>
                  <FormControl>
                    <TextArea {...field} placeholder="Add a note" rows={4} />
                  </FormControl>
                  <FormMessage {...field} />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-start my-2">
              <Button variant="destructive" type="submit" disabled={isRejecting}>
                {isRejecting ? <LoaderCircle className="animate-spin w-4 h-4" /> : <X />}
                Reject
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
