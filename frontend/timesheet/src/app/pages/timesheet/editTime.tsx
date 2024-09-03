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
import { TimesheetUpdateSchema } from "@/schema/timesheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/app/components/ui/form";
import { Typography } from "@/app/components/typography";
import { useEffect, useState } from "react";
import { Separator } from "@/app/components/ui/separator";
import { useToast } from "@/app/components/ui/use-toast";

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
}
export const EditTime = ({ employee, date, task, open, onClose }: EditTimeProps) => {
  const [employeeData, setEmployeeData] = useState<TaskProps>({
    data: [],
    task: "",
  });
  const columns = ["Hours", "Description", "Billable", "Action"];
  const { toast } = useToast();
  const { call: updateTimesheet } = useFrappePostCall("frappe_pms.timesheet.api.timesheet.update_timesheet_detail");
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

  const addEmptyFormRow = () => {
    const parent = employeeData.data[0].parent;
    const emptyRow: TaskDataItemProps = {
      hours: 0,
      description: "",
      is_billable: false,
      name: "",
      parent: parent,
      task: task,
      from_time: date,
      to_time: date,
      docstatus: 0 as 0 | 2 | 1,
    };
    setEmployeeData({ ...employeeData, data: [...employeeData.data, emptyRow] });
  };
  const removeFormRow = (index: number) => {
    setEmployeeData({ ...employeeData, data: employeeData.data.filter((_, i) => i !== index) });
  };
  const handleUpdate = (data: z.infer<typeof TimesheetUpdateSchema>) => {
    updateTimesheet(data)
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
            <Typography title={employeeData.task} variant="h6" className="max-w-80 truncate font-normal">
              {" "}
              {employeeData.task}
            </Typography>
            <Typography variant="h5" className="max-w-80 truncate font-normal">
              {" "}
              {prettyDate(date).date}
            </Typography>
          </div>
        </DialogHeader>
        {isLoading ? (
          <Spinner />
        ) : (
          <div>
            <div className="flex flex-col ">
              <div className="border-b bg-slate-50 border-slate-200 border-t flex items-center gap-2 h-10 ">
                {columns.map((column, key) => (
                  <Typography
                    variant="p"
                    className={cn(
                      "w-full px-2 text-slate-600 font-medium ",
                      key == 1 && "max-w-sm",
                      key != 1 && "max-w-28",
                      key == 0 && "max-w-16",
                      key == 2 && "text-center max-w-24",
                    )}
                  >
                    {column}
                  </Typography>
                ))}
              </div>
            </div>

            {employeeData.data?.map((item: TaskDataItemProps, index: number) => (
              <FormRow
                data={item}
                onRemove={() => removeFormRow(index)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        <DialogFooter className="sm:justify-start">
          <Button variant="outline" onClick={addEmptyFormRow}>
            Add Row
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface FormRowProps {
  data: TaskDataItemProps;
  onRemove: () => void;
  onUpdate: (data: z.infer<typeof TimesheetUpdateSchema>) => void;
  onDelete: (parent: string, name: string) => void;
}
const FormRow = ({ data, onRemove, onUpdate, onDelete }: FormRowProps) => {
  const form = useForm<z.infer<typeof TimesheetUpdateSchema>>({
    resolver: zodResolver(TimesheetUpdateSchema),
    defaultValues: {
      hours: floatToTime(data.hours),
      description: data.description,
      is_billable: Boolean(data.is_billable),
      name: data.name,
      parent: data.parent,
      task: data.task,
      date: data.from_time,
    },
    mode: "onBlur",
  });
  const handleSubmit = (data: z.infer<typeof TimesheetUpdateSchema>) => {
    onUpdate(data);
  };
  const handleDelete = () => {
    if (data.name.length == 0) {
      onRemove();
    } else {
      onDelete(data.parent, data.name);
    }
  };
  return (
    <Form {...form}>
      <form className="pt-2" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="flex gap-2 border-b pb-1 items-start">
          <FormField
            control={form.control}
            name="hours"
            render={({ field }) => {
              return (
                <FormItem className="w-full max-w-16 px-2">
                  <FormControl>
                    <Input
                      placeholder="00:00"
                      type="text"
                      {...field}
                      className={cn(
                        "p-1 max-w-12 focus-visible:ring-0 focus-visible:ring-offset-0",
                        form.formState.errors.hours && "border-red-500",
                      )}
                    />
                  </FormControl>
                  {/* <FormMessage  className="text-xs" /> */}
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => {
              return (
                <FormItem className="w-full max-w-sm px-2">
                  <FormControl>
                    <Textarea
                      rows={field.value ? 3 : 1}
                      style={{
                        height: +"px",
                      }}
                      {...field}
                      onChange={field.onChange}
                      className={cn(
                        "focus-visible:ring-0 focus-visible:ring-offset-0 min-h-10",
                        form.formState.errors.description && "border-red-500",
                      )}
                    />
                  </FormControl>
                  {/* <FormMessage  className="text-xs" /> */}
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="is_billable"
            render={({ field }) => {
              return (
                <FormItem className="w-full flex justify-center items-center min-h-10 max-w-24 px-2 text-center">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  {/* <FormMessage  className="text-xs" /> */}
                </FormItem>
              );
            }}
          />

          <div className="w-full max-w-28 flex justify-center items-center min-h-10 gap-2 px-2">
            <Button variant="success" className="p-1 h-fit" disabled={!form.formState.isValid}>
              Save
            </Button>
            <Button variant="destructive" className="p-1 h-fit" type="button" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
