/**
 * External dependencies
 */
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useSelector } from "react-redux";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { z } from "zod";

/**
 * Internal dependencies
 */
import { Spinner } from "@/app/components/spinner";
import { Typography } from "@/app/components/typography";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/components/ui/use-toast";
import { cn, floatToTime, parseFrappeErrorMsg, prettyDate } from "@/lib/utils";
import { TimesheetUpdateSchema } from "@/schema/timesheet";
import { RootState } from "@/store";

interface EditTimeProps {
  employee: string;
  date: string;
  task: string;
  open: boolean;
  onClose: () => void;
}

export const EditTime = ({ employee, date, task, open, onClose }: EditTimeProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useSelector((state: RootState) => state.user);
  const hasAccess = user.roles.includes("Projects Manager") || user.roles.includes("Timesheet Manager");

  const form = useForm<z.infer<typeof TimesheetUpdateSchema>>({
    resolver: zodResolver(TimesheetUpdateSchema),
    defaultValues: {
      data: [],
    }, // Empty array by default
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "data",
  });

  const columns = ["Hours", "Description", "Billable", ""];
  const { toast } = useToast();
  const { call: updateTimesheet } = useFrappePostCall("next_pms.timesheet.api.timesheet.bulk_update_timesheet_detail");
  const { call: deleteTimesheet } = useFrappePostCall("next_pms.timesheet.api.timesheet.delete");
  const { data, isLoading, mutate } = useFrappeGetCall("next_pms.timesheet.api.timesheet.get_timesheet_details", {
    employee: employee,
    date: date,
    task: task,
  });

  useEffect(() => {
    if (data) {
      const updatedData = data.message.data.map((item) => {
        return {
          ...item,
          hours: floatToTime(item.hours),
        };
      });
      form.reset({ data: updatedData });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const addEmptyFormRow = () => {
    const parent = fields[0]?.parent || "";
    const newRow = {
      hours: "00:00",
      description: "",
      is_billable: false,
      name: "",
      parent: parent,
      task: task,
      date: date,
    };
    append(newRow,{ shouldFocus: false });
  };

  const handleUpdate = (formData: z.infer<typeof TimesheetUpdateSchema>) => {
    setIsSubmitting(true);
    const data = {
      data: formData.data,
    };
    updateTimesheet(data)
      .then((res) => {
        mutate();
        toast({
          variant: "success",
          description: res.message,
        });
        setIsSubmitting(false);
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

  const removeFormRow = (index: number) => {
    const currentData = form.getValues().data || [];
    const rowToDelete = currentData[index];
    if (!rowToDelete?.name) {
      remove(index);
    } else {
      handleDelete(rowToDelete.parent, rowToDelete.name);
    }
  };
  const handleDelete = (parent: string, name: string) => {
    deleteTimesheet({ parent, name })
      .then((res) => {
        mutate();
        toast({
          variant: "success",
          description: res.message,
        });
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Time</DialogTitle>
          <Separator />
          <div className="flex justify-between w-full overflow-hidden">
            <span className="flex flex-col">
              <Typography title={data?.message?.task} variant="p" className="max-w-80 truncate font-semibold">
                {data?.message?.task}
              </Typography>
              <Typography title={data?.message?.project} variant="small" className="max-w-80 truncate">
                {data?.message?.project}
              </Typography>
            </span>
            <Typography variant="h6" className="max-w-80 truncate font-normal">
              {prettyDate(date).date}
            </Typography>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)}>
            {isLoading ? (
              <Spinner />
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <div className="flex flex-col ">
                  <div className="border-b bg-slate-50 border-slate-200 border-t flex items-center gap-2 h-10 ">
                    {columns.map((column, key) => (
                      <Typography
                        key={`column-${key}`}
                        variant="p"
                        className={cn(
                          "w-full px-2 text-slate-600 font-medium ",
                          key != 1 && "max-w-16",
                          key == 0 && "max-w-16",
                          key == 2 && "max-w-8",
                          key == 2 && !hasAccess && "hidden"
                        )}
                      >
                        {column}
                      </Typography>
                    ))}
                  </div>
                </div>

                {fields.map((item, index: number) => (
                  <div className="flex gap-2 border-b pb-1 items-start pt-1" key={item.id}>
                    <FormField
                      control={form.control}
                      name={`data.${index}.hours`}
                      render={({ field }) => {
                        return (
                          <FormItem className="w-full max-w-16 px-2">
                            <FormControl>
                              <Input
                                placeholder="00:00"
                                type="text"
                                {...field}
                                className={cn("p-1 max-w-12 focus-visible:ring-0 focus-visible:ring-offset-0")}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name={`data.${index}.description`}
                      render={({ field }) => {
                        return (
                          <FormItem className="w-full  px-2">
                            <FormControl>
                              <Textarea
                                rows={3}
                                {...field}
                                onChange={field.onChange}
                                className={cn("focus-visible:ring-0 focus-visible:ring-offset-0 min-h-10")}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        );
                      }}
                    />
                    {hasAccess && (
                      <FormField
                        control={form.control}
                        name={`data.${index}.is_billable`}
                        render={({ field }) => {
                          return (
                            <FormItem className="w-full flex justify-center items-center min-h-10 max-w-12 px-2 text-center">
                              <FormControl>
                                <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          );
                        }}
                      />
                    )}
                    <div className=" flex items-center min-h-10 gap-2 px-2">
                      <Button
                        variant="destructive"
                        className="p-1 h-fit"
                        type="button"
                        onClick={() => removeFormRow(index)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter className="sm:justify-between mt-2">
              <Button type="button" variant="outline" onClick={addEmptyFormRow}>
                <Plus />
                Add Row
              </Button>
              <Button variant="success" disabled={!form.formState.isValid || !form.formState.isDirty || isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : <Save />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
