/**
 * External dependencies
 */
import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DatePicker,
  Spinner,
  Typography,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
  useToast,
  TextEditor,
} from "@next-pms/design-system/components";
import { getFormatedDate } from "@next-pms/design-system/date";
import { floatToTime, mergeClassNames } from "@next-pms/design-system/utils";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { z } from "zod";
/**
 * Internal dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { TimesheetUpdateSchema } from "@/schema/timesheet";
import type { EditTimeProps, TimesheetDetail } from "./types";

export const EditTime = ({ employee, date, task, open, onClose, user }: EditTimeProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAccess = user.roles.includes("Projects Manager") || user.roles.includes("Timesheet Manager");

  const form = useForm<z.infer<typeof TimesheetUpdateSchema>>({
    resolver: zodResolver(TimesheetUpdateSchema),
    defaultValues: {
      data: [],
    },
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "data",
  });

  const columns = ["Date", "Hours", "Description", "Billable", ""];
  const { toast } = useToast();
  const { call: updateTimesheet } = useFrappePostCall("next_pms.timesheet.api.timesheet.bulk_update_timesheet_detail");
  const { call: deleteTimesheet } = useFrappePostCall("next_pms.timesheet.api.timesheet.delete");
  const { data, isLoading, mutate } = useFrappeGetCall("next_pms.timesheet.api.timesheet.get_timesheet_details", {
    employee: employee,
    date: date,
    task: task,
  });

  const updatedData = useMemo(() => {
    if (!data) return [];
    const updatedData = data.message.data.map((item: TimesheetDetail) => {
      return {
        ...item,
        hours: floatToTime(item.hours),
      };
    });
    return updatedData;
  }, [data]);

  useEffect(() => {
    if (data) {
      form.reset({ data: updatedData });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const addEmptyFormRow = () => {
    const parent = fields[0]?.parent || "";
    const newRow = {
      hours: "00:00",
      description: "",
      name: "",
      parent: parent,
      task: task,
      date: date,
    };
    append(newRow, { shouldFocus: true });
  };

  const handleUpdate = (formData: z.infer<typeof TimesheetUpdateSchema>) => {
    setIsSubmitting(true);
    const data = {
      data: formData.data,
    };
    updateTimesheet(data)
      .then((res) => {
        mutate();
        form.reset({ data: updatedData });
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Time</DialogTitle>
          <Separator />
          <div className="flex justify-between w-full ">
            <span className="flex flex-col items-start">
              <Typography title={data?.message?.task} variant="p" className="max-w-80 truncate font-semibold">
                {data?.message?.task}
              </Typography>
              <Typography title={data?.message?.project} variant="small" className="max-w-80 truncate">
                {data?.message?.project}
              </Typography>
            </span>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)}>
            {isLoading ? (
              <Spinner />
            ) : (
              <div className=" max-md:flex max-md:flex-col max-md:gap-y-3">
                <div className="flex flex-col max-md:hidden">
                  <div className="py-2 bg-muted rounded-lg flex items-center gap-2 h-10 mb-5">
                    {columns.map((column, key) => (
                      <Typography
                        key={`column-${key}`}
                        variant="p"
                        className={mergeClassNames(
                          "w-full px-2 text-slate-600 dark:text-slate-200 font-medium ",
                          key != 2 && "max-w-16",
                          key == 0 && "max-w-28",
                          key == 3 && "max-w-8",
                          key == 3 && !hasAccess && "hidden"
                        )}
                      >
                        {column}
                      </Typography>
                    ))}
                  </div>
                </div>
                {fields.map((item, index: number) => (
                  <div
                    className="flex gap-2 border-b pb-5 items-start pt-1 max-md:border max-md:rounded-md max-md:p-4 max-md:flex-col"
                    key={item.id}
                  >
                    <FormField
                      control={form.control}
                      name={`data.${index}.date`}
                      render={({ field }) => (
                        <FormItem className="w-full md:max-w-28 space-y-2 truncate">
                          <FormLabel className="flex gap-2 items-center md:hidden">
                            <p title="subject" className="text-sm truncate">
                              Date
                            </p>
                          </FormLabel>
                          <FormControl>
                            <DatePicker
                              date={new Date(field.value)}
                              onDateChange={(date) => {
                                if (!date) return;
                                form.setValue(`data.${index}.date`, getFormatedDate(date), {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                  shouldTouch: true,
                                });
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`data.${index}.hours`}
                      render={({ field }) => {
                        return (
                          <FormItem className="w-full md:max-w-16 max-md:w-full md:px-2">
                            <FormLabel className="flex gap-2 items-center md:hidden">
                              <p title="subject" className="text-sm truncate">
                                Hours
                              </p>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="00:00"
                                type="text"
                                {...field}
                                className={mergeClassNames(
                                  "p-1 md:max-w-12 focus-visible:ring-0 focus-visible:ring-offset-0"
                                )}
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
                          <FormItem className="w-full md:px-2 ">
                            <FormLabel className="flex gap-2 items-center md:hidden">
                              <p title="subject" className="text-sm truncate">
                                Description
                              </p>
                            </FormLabel>
                            <FormControl>
                              <TextEditor
                                placeholder="Explain your progress"
                                defaultValue={field.value}
                                onChange={field.onChange}
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
                            <FormItem className="w-full md:flex md:justify-center md:items-center md:min-h-10 md:max-w-12 md:px-2 md:text-center">
                              <FormLabel className="flex gap-2 items-center md:hidden">
                                <p title="subject" className="text-sm truncate">
                                  Billable
                                </p>
                              </FormLabel>
                              <FormControl>
                                <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          );
                        }}
                      />
                    )}
                    <div className=" flex items-center min-h-10 gap-2 md:px-2 max-md:w-full">
                      <Button
                        variant="destructive"
                        className="p-1 h-fit max-md:h-8 max-md:w-full  mt-1 max-md:flex max-md:justify-center max-md:items-center"
                        type="button"
                        onClick={() => removeFormRow(index)}
                      >
                        <Trash2 />{" "}
                        <Typography className="hidden text-sm text-white max-md:block" variant="p">
                          Delete Row
                        </Typography>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter className="sm:justify-between mt-4 flex max-md:flex-col gap-y-2">
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
