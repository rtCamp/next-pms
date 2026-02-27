/**
 * External Dependencies
 */
import { useForm } from "@tanstack/react-form";
import { DatePicker, Dialog, Button, TabButtons, Select, Textarea } from "@rtcamp/frappe-ui-react";
import { getTodayDate } from "@next-pms/design-system/date";
import { Calendar, CalendarX2 } from "lucide-react";
import { useFrappeCreateDoc, useFrappeGetCall } from "frappe-react-sdk";
import { useToast } from "@next-pms/design-system/hooks";

/**
 * Internal Dependencies
 */
import type { LeaveTimeProps } from "./types";
import { addLeaveFormSchema } from "./schema";
import { parseFrappeErrorMsg } from "@/lib/utils";

const AddLeave = ({ employee, employeeName, open = false, onOpenChange, onSuccess }: LeaveTimeProps) => {
  const { toast } = useToast();
  const { createDoc, loading, isCompleted } = useFrappeCreateDoc();

  const { data: leaveDetails } = useFrappeGetCall(
    "hrms.hr.doctype.leave_application.leave_application.get_leave_details",
    {
      employee: employee,
      date: getTodayDate(),
    }
  );

  console.log(leaveDetails);

  const form = useForm({
    defaultValues: {
      fromDate: getTodayDate(),
      toDate: getTodayDate(),
      leaveDuration: "first-half",
      leaveType: "unpaid",
      reason: "",
    },
    validators: {
      onSubmit: addLeaveFormSchema,
    },
    onSubmit: async ({ value }) => {
    //   try {
    //     await createDoc("Leave Application", data);
    //     toast({
    //       variant: "success",
    //       description: "Leave created successfully",
    //     });
    //     handleOpen();
    //     onSuccess?.();
    //   } catch (error) {
    //     const error = parseFrappeErrorMsg(err);
    //     toast({
    //       description: error,
    //       variant: "destructive",
    //     });
    //   }
    },
  });

  const handleOpen = () => {
    form.reset();
    onOpenChange();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpen}
      actions={
        <Button
          className="w-full"
          variant="solid"
          iconLeft={() => <CalendarX2 />}
          label="Add time-off"
          onClick={() => {
            form.handleSubmit();
          }}
        />
      }
      options={{
        title: "Add time-off",
      }}
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <form.Field
            name="fromDate"
            children={(field) => {
              return (
                <div className="flex-1 flex w-full flex-col space-y-1.5">
                  <label className="block text-xs text-ink-gray-5">From</label>
                  <DatePicker
                    label="From"
                    onChange={(val) => field.handleChange(val as string)}
                    placeholder="Placeholder"
                    value={field.state.value}
                  >
                    {({ displayValue }) => {
                      return (
                        <div
                          className={`relative flex items-center border border-outline-gray-2 px-[10px] py-1 rounded-lg`}
                        >
                          <input type="text" id="start" value={displayValue} className={`flex-1`} placeholder="Today" />
                          <Calendar className="size-4" />
                        </div>
                      );
                    }}
                  </DatePicker>
                </div>
              );
            }}
          />
          <form.Field
            name="toDate"
            children={(field) => {
              return (
                <div className="flex-1 flex w-full flex-col space-y-1.5">
                  <label className="block text-xs text-ink-gray-5">From</label>
                  <DatePicker label="From" onChange={() => {}} placeholder="Placeholder" value="">
                    {({ displayValue }) => {
                      return (
                        <div
                          className={`relative flex items-center border border-outline-gray-2 px-[10px] py-1 rounded-lg`}
                        >
                          <input type="text" id="start" value={displayValue} className={`flex-1`} placeholder="Today" />
                          <Calendar className="size-4" />
                        </div>
                      );
                    }}
                  </DatePicker>
                </div>
              );
            }}
          />
        </div>

        <form.Field
          name="leaveDuration"
          children={(field) => {
            return (
              <>
                <label className="block text-xs text-ink-gray-5">Leave duration</label>
                <TabButtons
                  className="h-8"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val as string)}
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
                />
              </>
            );
          }}
        />

        <form.Field
          name="leaveType"
          children={(field) => {
            return (
              <>
                <label className="block text-xs text-ink-gray-5">Leave type</label>

                <Select
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val as string)}
                  variant="outline"
                  className="h-8"
                  options={[
                    {
                      label: "Paid time off",
                      value: "paid",
                    },
                    {
                      label: "Unpaid time off",
                      value: "unpaid",
                    },
                    {
                      label: "Paternity time off",
                      value: "paternity",
                    },
                  ]}
                  placeholder="Select Leave Type"
                />
              </>
            );
          }}
        />
        <form.Field
          name="reason"
          children={(field) => {
            return (
              <>
                <label className="block text-xs text-ink-gray-5">Reason</label>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="bg-white border-outline-gray-2"
                />
              </>
            );
          }}
        />
      </div>
    </Dialog>
  );
};

export default AddLeave;
