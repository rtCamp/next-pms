/**
 * External Dependencies
 */
import { useForm } from "@tanstack/react-form";
import { DatePicker, Dialog, Button, TabButtons, Select, Textarea, ErrorMessage } from "@rtcamp/frappe-ui-react";
import { getTodayDate } from "@next-pms/design-system/date";
import { Calendar, CalendarX2 } from "lucide-react";
import { FrappeError, useFrappeCreateDoc, useFrappeGetCall } from "frappe-react-sdk";
import { useToasts } from "@rtcamp/frappe-ui-react";

/**
 * Internal Dependencies
 */
import { type LeaveTimeProps, LEAVE_DURATION } from "./types";
import { addLeaveFormSchema } from "./schema";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";

const AddLeave = ({ open = false, onOpenChange }: LeaveTimeProps) => {
  const user = useUser();

  const toast = useToasts();
  const { createDoc, loading } = useFrappeCreateDoc();

  const { data: leaveDetails } = useFrappeGetCall(
    "hrms.hr.doctype.leave_application.leave_application.get_leave_details",
    {
      employee: user.employee,
      date: getTodayDate(),
    },
  );

  const leaveTypeOptions = ((leaveDetails?.message?.lwps as string[]) || []).map((val) => ({ label: val, value: val }));

  const form = useForm({
    defaultValues: {
      fromDate: getTodayDate(),
      toDate: getTodayDate(),
      leaveDuration: LEAVE_DURATION[0] as string,
      leaveType: "",
      reason: "",
    },
    validators: {
      onSubmit: addLeaveFormSchema,
    },
    onSubmit: async ({ value }) => {
      // Convert to Title case
      const custom_first_halfsecond_half = value.leaveDuration
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const half_day = value.leaveType === "first-half" || value.leaveType === "second-half";

      try {
        const data = {
          employee,
          description: "",
          from_date: value.fromDate,
          to_date: value.toDate,
          leave_type: value.leaveType,
          half_day,
          custom_first_halfsecond_half,
        };
        await createDoc("Leave Application", data);
        toast.success("Leave created successfully");
      } catch (err) {
        const error = parseFrappeErrorMsg(err as FrappeError);
        toast.error(error);
      } finally {
        onOpenChange(false);
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      actions={
        <Button
          className="w-full"
          variant="solid"
          iconLeft={() => <CalendarX2 />}
          label="Add time-off"
          disabled={loading}
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
                    placeholder="Start Date"
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
                  {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
                </div>
              );
            }}
          />
          <form.Field
            name="toDate"
            children={(field) => {
              return (
                <div className="flex-1 flex w-full flex-col space-y-1.5">
                  <label className="block text-xs text-ink-gray-5">To</label>
                  <DatePicker
                    label="To"
                    onChange={(val) => field.handleChange(val as string)}
                    placeholder="End Date"
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
                  {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
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
                  className="h-"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val as string)}
                  buttons={LEAVE_DURATION.map((value) => ({
                    label: value
                      .split("-")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" "),
                    value,
                  }))}
                />
                {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
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
                  options={leaveTypeOptions}
                  placeholder="Select Leave Type"
                />
                {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
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
                {!field.state.meta.isValid && <ErrorMessage message={field.state.meta.errors[0]?.message} />}
              </>
            );
          }}
        />
      </div>
    </Dialog>
  );
};

export default AddLeave;
