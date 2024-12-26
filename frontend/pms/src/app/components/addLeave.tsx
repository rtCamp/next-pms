/**
 * External Dependencies
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectItem } from "@radix-ui/react-select";
import { Save, Search, X } from "lucide-react";
import { z } from "zod";

/**
 * Internal Dependencies
 */
import { ComboxBox } from "@/app/components/comboBox";
import { DatePicker } from "@/app/components/datePicker";
import EmployeeCombo from "@/app/components/employeeComboBox";
import { Typography } from "@/app/components/typography";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/components/ui/use-toast";
import { getFormatedDate } from "@/lib/utils";
import { LeaveSchema } from "@/schema/timesheet";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";

// interfaces
interface LeaveTimeProps {
  employee: string;
  open: boolean;
  onOpenChange: () => void;
  onSuccess?: () => void;
}
const AddLeave = ({ employee, open = false, onOpenChange, onSuccess }: LeaveTimeProps) => {
  const { toast } = useToast();
  // States
  const [selectedEmployee, setSelectedEmployee] = useState(employee);
  const [selectedFromDate, setSelectedFromDate] = useState(getFormatedDate(""));
  const [selectedToDate, setSelectedToDate] = useState(getFormatedDate(""));
  const [selectedLeaveType, setSelectedLeaveType] = useState<string[]>();

  // Form Schema definition
  const form = useForm<z.infer<typeof LeaveSchema>>({
    resolver: zodResolver(LeaveSchema),
    defaultValues: {
      employee: employee,
      reason: "",
      from_date: "",
      to_date: "",
      leave_type: "",
      half_day: false,
    },
    mode: "onSubmit",
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  const handleSubmit = (data: z.infer<typeof LeaveSchema>) => {
    console.log(data);
  };
  const handleOpen = () => {
    // if (submitting) return;
    // form.reset();
    onOpenChange();
  };

  // Employee combo-box
  const onEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
    form.setValue("employee", value);
  };

  // Date Change Handlers
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

  // Leave Change handler
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
        <DialogContent className="max-w-xl" onPointerDownOutside={event?.preventDefault}>
          <DialogHeader>
            <DialogTitle className="flex gap-x-2">Add Leave</DialogTitle>
            <Separator />
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex flex-col gap-y-4">
                <FormField
                  control={form.control}
                  name="employee"
                  render={() => (
                    <FormItem className="w-full space-y-1">
                      <FormLabel className="flex gap-2 items-center text-sm">Employee</FormLabel>
                      <FormControl>
                        <EmployeeCombo onSelect={onEmployeeChange} value={selectedEmployee} />
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
                  <ComboxBox
                    isMulti={false}
                    label="Search Leave Type"
                    showSelected
                    shouldFilter
                    value={selectedLeaveType}
                    data={[
                      {
                        label: "Unpaid Time Off",
                        value: "Unpaid Time Off",
                        disabled: false,
                      },
                    ]}
                    onSelect={handleLeaveChange}
                    rightIcon={<Search className="h-4 w-4 stroke-slate-400" />}
                  />
                </FormItem>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain your progress"
                          rows={4}
                          className="w-full placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid max-sm:gap-y-4 sm:gap-x-4 max-sm:grid-rows-2 sm:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="half_day"
                    render={({ field }) => (
                      <FormItem className="flex w-full space-y-1 items-center gap-2">
                        <FormLabel>Half day</FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(value) => {
                              form.setValue("half_day", value as boolean);
                            }}
                            className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 [&>*]:m-0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="selected_half"
                    render={({ field }) => (
                      <FormItem className="space-y-1 col-span-3">
                        <FormControl>
                          <Select>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Half" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="First Half">First Half</SelectItem>
                              <SelectItem value="Second Half">Second Half</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="sm:justify-start w-full pt-3">
                  <div className="flex gap-x-4 w-full">
                    <Button disabled={!isDirty || !isValid}>
                      <Save className="w-4 h-4" />
                      Add Leave
                    </Button>
                    <Button variant="secondary" type="button" onClick={handleOpen}>
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddLeave;
