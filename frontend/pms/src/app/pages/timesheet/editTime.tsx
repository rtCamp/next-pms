import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Spinner } from "@/app/components/spinner";
import { TaskDataItemProps } from "@/types/timesheet";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Button } from "@/app/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn, floatToTime, parseFrappeErrorMsg, prettyDate } from "@/lib/utils";
import { TimesheetUpdateSchema, timeStringToFloat } from "@/schema/timesheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/app/components/ui/form";
import { Typography } from "@/app/components/typography";
import { useEffect, useState } from "react";
import { Separator } from "@/app/components/ui/separator";
import { useToast } from "@/app/components/ui/use-toast";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface EditTimeProps {
  employee: string;
  date: string;
  task: string;
  open: boolean;
  onClose: () => void;
}
interface TaskProps {
  data: TaskDataItemProps[];
  task: string;
  project: string;
}
export const EditTime = ({ employee, date, task, open, onClose }: EditTimeProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useSelector((state: RootState) => state.user);
  const hasAccess = user.roles.includes("Projects Manager") || user.roles.includes("Timesheet Manager");
  const [employeeData, setEmployeeData] = useState<TaskProps>({
    data: [],
    task: "",
    project: "",
  });
  const form = useForm<z.infer<typeof TimesheetUpdateSchema>>({
    resolver: zodResolver(TimesheetUpdateSchema),
    defaultValues: {
      data: [],
    }, // Empty array by default
    mode: "onSubmit",
  });

  const columns = ["Hours", "Description", "Billable", ""];
  const { toast } = useToast();
  const { call: updateTimesheet } = useFrappePostCall(
    "frappe_pms.timesheet.api.timesheet.bulk_update_timesheet_detail"
  );
  const { call: deleteTimesheet } = useFrappePostCall("frappe_pms.timesheet.api.timesheet.delete");
  const { data, isLoading, mutate } = useFrappeGetCall("frappe_pms.timesheet.api.timesheet.get_timesheet_details", {
    employee: employee,
    date: date,
    task: task,
  });

  useEffect(() => {
    if (data) {
      setEmployeeData(data.message);
    }
  }, [data]);

  useEffect(() => {
    const data = {
      data: employeeData.data.map((item) => {
        return {
          ...item,
          hours: floatToTime(item.hours),
        };
      }),
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    form.reset(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeData]);

  const addEmptyFormRow = () => {
    const parent = employeeData.data[0].parent;
    const emptyRow = {
      hours: 0,
      description: "",
      is_billable: false,
      name: "",
      parent: parent,
      task: task,
      date: date,
    };
    const updatedData = form.getValues().data;
    updatedData.forEach((item) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      item.hours = timeStringToFloat(item.hours);
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setEmployeeData({ ...employeeData, data: [...updatedData, emptyRow] });
  };

  const removeFormRow = (index: number) => {
    const values = form.getValues();
    const data = values.data[index];
    if (data.name.length == 0) {
      setEmployeeData({ ...employeeData, data: employeeData.data.filter((_, i) => i !== index) });
    } else {
      handleDelete(data.parent, data.name);
    }
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
              <Typography title={employeeData.task} variant="p" className="max-w-80 truncate font-semibold">
                {employeeData.task}
              </Typography>
              <Typography title={employeeData.project} variant="small" className="max-w-80 truncate">
                {employeeData.project}
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
              <div>
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

                {employeeData.data.map((item, index: number) => (
                  <div className="flex gap-2 border-b pb-1 items-start pt-1" key={index}>
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
              <Button variant="outline" onClick={addEmptyFormRow}>
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
