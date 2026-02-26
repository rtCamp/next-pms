/**
 * External Dependencies
 */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ComboBox,
  //   DatePicker,
  //   Button,
  //   Dialog,
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
  //   TextArea,
  Checkbox,
  //   Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@next-pms/design-system/components";
import { DatePicker, Dialog, Button, TabButtons, Select, Textarea, TextInput } from "@rtcamp/frappe-ui-react";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system/date";
import { useToast } from "@next-pms/design-system/hooks";
import { useFrappeCreateDoc, useFrappeGetCall } from "frappe-react-sdk";
import { Calendar, CalendarX2, LoaderCircle, Save, Search, X } from "lucide-react";
import { z } from "zod";
/**
 * Internal Dependencies
 */
import EmployeeCombo from "@/app/components/employeeComboBox";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { LeaveSchema } from "@/schema/timesheet";
import { LeaveInfo } from "./leaveInfo";
import type { LeaveTimeProps } from "./types";

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
    },
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
    form.setValue("employee", value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleFromDateChange = (date: Date | undefined) => {
    if (!date) return;
    form.setValue("from_date", getFormatedDate(date), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setSelectedFromDate(getFormatedDate(date));
  };

  const handleToDateChange = (date: Date | undefined) => {
    if (!date) return;
    form.setValue("to_date", getFormatedDate(date), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setSelectedToDate(getFormatedDate(date));
  };

  const handleLeaveChange = (value: string | string[]) => {
    if (value instanceof Array) {
      setSelectedLeaveType(value);
      form.setValue("leave_type", value[0], {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    } else {
      setSelectedLeaveType([value]);
      form.setValue("leave_type", value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpen}
      actions={<Button className="w-full" variant="solid" iconLeft={() => <CalendarX2 />} label="Add time-off" />}
      options={{
        title: "Add time-off",
      }}
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <DatePicker label="From" onChange={() => {}} placeholder="Placeholder" value="">
              {({ displayValue }) => {
                return (
                  <div className=" flex-1 flex w-full flex-col space-y-1.5 ">
                    <label className="block text-xs text-ink-gray-5">From</label>
                    <div
                      className={`relative flex items-center border border-outline-gray-2 px-[10px] py-2 rounded-lg`}
                    >
                      <input type="text" id="start" value={displayValue} className={`flex-1`} placeholder="Today" />
                      <Calendar className="size-4" />
                    </div>
                  </div>
                );
              }}
            </DatePicker>
          </div>
          <div className="flex-1">
            <DatePicker label="From" onChange={() => {}} placeholder="Placeholder" value="">
              {({ displayValue }) => {
                return (
                  <div className=" flex-1 flex w-full flex-col space-y-1.5 ">
                    <label className="block text-xs text-ink-gray-5">From</label>
                    <div
                      className={`relative flex items-center border border-outline-gray-2 px-[10px] py-2 rounded-lg`}
                    >
                      <input type="text" id="start" value={displayValue} className={`flex-1`} placeholder="Today" />
                      <Calendar className="size-4" />
                    </div>
                  </div>
                );
              }}
            </DatePicker>
          </div>
        </div>

        <label className="block text-xs text-ink-gray-5">Leave duration</label>
        <TabButtons
          buttons={[
            {
              label: "Full day",
              value: "full-day",
            },
            {
              label: "First half",
              value: "first-half",
            },
            {
              label: "Second half",
              value: "second-half",
            },
          ]}
          onChange={() => {}}
          value="second-half"
        />
        <label className="block text-xs text-ink-gray-5">Leave type</label>
        <Select
          options={[
            {
              label: "Paid time-off",
              value: "paid",
            },
            {
              label: "Unpaid time-off",
              value: "unpaid",
            },
            {
              label: "Paternity time-off",
              value: "paternity",
            },
          ]}
          value="without-pay"
        />
        <label className="block text-xs text-ink-gray-5">Reason</label>
        <Textarea className="bg-white border-outline-gray-2" />
      </div>
    </Dialog>
  );
};

export default AddLeave;
