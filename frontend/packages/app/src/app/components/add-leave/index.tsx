/**
 * External Dependencies
 */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ComboBox,
  DatePicker,
  Button,
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
  Separator,
  TextArea,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@next-pms/design-system/components";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system/date";
import { useToast } from "@next-pms/design-system/hooks";
import { useFrappeCreateDoc, useFrappeGetCall } from "frappe-react-sdk";
import { LoaderCircle, Save, Search, X } from "lucide-react";
import { z } from "zod";
/**
 * Internal Dependencies
 */
import EmployeeCombo from "@/app/components/employeeComboBox";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { LeaveSchema } from "@/schema/timesheet";
import { LeaveInfo } from "./leaveInfo";

interface LeaveTimeProps {
  employee: string;
  employeeName: string;
  open: boolean;
  onOpenChange: () => void;
  onSuccess?: () => void;
}
const AddLeave = ({ employee, employeeName, open = false, onOpenChange, onSuccess }: LeaveTimeProps) => {
  const { toast } = useToast();
  const { createDoc, loading, isCompleted } = useFrappeCreateDoc();

  const [selectedEmployee, setSelectedEmployee] = useState(employee);

  const [selectedFromDate, setSelectedFromDate] = useState(getTodayDate());
  const [selectedToDate, setSelectedToDate] = useState(getTodayDate());
  const [selectedLeaveType, setSelectedLeaveType] = useState<string[]>();
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [leaveType, setLeaveType] = useState<Array<string>>([]);
  const postingDate = getTodayDate();

  const { data: leaveDetails } = useFrappeGetCall(
    "hrms.hr.doctype.leave_application.leave_application.get_leave_details",
    {
      employee: selectedEmployee,
      date: postingDate,
    }
  );

  useEffect(() => {
    if (!leaveDetails) return;
    const leaveType = Object.keys(leaveDetails?.message?.leave_allocation);
    const types = leaveType.concat(leaveDetails?.message?.lwps);
    setLeaveType(types);
  }, [leaveDetails]);

  const form = useForm<z.infer<typeof LeaveSchema>>({
    resolver: zodResolver(LeaveSchema),
    defaultValues: {
      employee: employee,
      description: "",
      from_date: selectedFromDate,
      to_date: selectedToDate,
      leave_type: "",
      half_day: false,
      custom_first_halfsecond_half: "First Half",
    },
    mode: "onSubmit",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const handleSubmit = (data: z.infer<typeof LeaveSchema>) => {
    createDoc("Leave Application", data)
      .then(() => {
        toast({
          variant: "success",
          description: "Leave created successfully",
        });

        handleOpen();
        onSuccess?.();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          description: error,
          variant: "destructive",
        });
      });
  };
  const handleOpen = () => {
    form.reset();
    onOpenChange();
  };

  const onEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    form.setValue("employee", value);
  };

  const handleFromDateChange = (date: Date | undefined) => {
    if (!date) return;
    form.setValue("from_date", getFormatedDate(date));
    setSelectedFromDate(getFormatedDate(date));
  };

  const handleToDateChange = (date: Date | undefined) => {
    if (!date) return;
    form.setValue("to_date", getFormatedDate(date));
    setSelectedToDate(getFormatedDate(date));
  };

  const handleLeaveChange = (value: string | string[]) => {
    if (value instanceof Array) {
      setSelectedLeaveType(value);
      form.setValue("leave_type", value[0]);
    } else {
      setSelectedLeaveType([value]);
      form.setValue("leave_type", value);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-w-xl " onPointerDownOutside={event?.preventDefault}>
          <DialogHeader>
            <DialogTitle className="flex gap-x-2">Add Leave</DialogTitle>
            <Separator />
          </DialogHeader>

          <LeaveInfo leaveInfo={leaveDetails?.message?.leave_allocation} />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="overflow-y-auto no-scrollbar">
                <div className="flex flex-col gap-y-4">
                  <FormField
                    control={form.control}
                    name="employee"
                    render={() => (
                      <FormItem className="w-full space-y-1">
                        <FormLabel className="flex gap-2 items-center text-sm">Employee</FormLabel>
                        <FormControl>
                          <EmployeeCombo
                            onSelect={onEmployeeChange}
                            employeeName={employeeName}
                            value={selectedEmployee}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid max-sm:gap-y-4 sm:gap-x-4 max-sm:grid-rows-2 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="from_date"
                      render={({ field }) => (
                        <FormItem className="w-full space-y-1">
                          <FormLabel className="flex gap-2 items-center text-sm">From</FormLabel>
                          <FormControl>
                            <DatePicker date={field.value} onDateChange={handleFromDateChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="to_date"
                      render={({ field }) => (
                        <FormItem className="w-full space-y-1">
                          <FormLabel className="flex gap-2 items-center text-sm">To</FormLabel>
                          <FormControl>
                            <DatePicker date={field.value} onDateChange={handleToDateChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormItem className="space-y-1">
                    <FormLabel>Leave Type</FormLabel>
                    <ComboBox
                      isMulti={false}
                      label="Search Leave Type"
                      showSelected
                      shouldFilter
                      value={selectedLeaveType}
                      data={leaveType.map((item) => ({ label: item, value: item }))}
                      onSelect={handleLeaveChange}
                      rightIcon={<Search className="h-4 w-4 stroke-slate-400" />}
                    />
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <TextArea
                            placeholder="Reason for leave"
                            rows={4}
                            className="w-full placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="half_day"
                    render={({ field }) => (
                      <FormItem className="space-y-0 pl-1 gap-x-2 flex items-center">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(value) => {
                              form.setValue("half_day", value as boolean);
                              setIsHalfDay(value as boolean);
                            }}
                          />
                        </FormControl>
                        <FormLabel>Half day</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isHalfDay && (
                    <FormField
                      control={form.control}
                      name="custom_first_halfsecond_half"
                      render={() => (
                        <FormItem className="space-y-1 col-span-3">
                          <FormLabel>First Half / Second Half</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                form.setValue("custom_first_halfsecond_half", value);
                              }}
                              defaultValue="First Half"
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Half" />
                              </SelectTrigger>
                              <SelectContent side="top">
                                <SelectItem value="First Half">First Half</SelectItem>
                                <SelectItem value="Second Half">Second Half</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
              <DialogFooter className="sm:justify-start w-full pt-3">
                <div className="flex gap-x-4 w-full">
                  <Button disabled={!isDirty || !isValid || (loading && !isCompleted)}>
                    {loading && !isCompleted ? <LoaderCircle className="animate-spin " /> : <Save />}
                    Add Leave
                  </Button>
                  <Button variant="secondary" type="button" onClick={handleOpen}>
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddLeave;
