/**
 * External Dependencies
 */
import { useState } from "react";
import { floatToTime } from "@next-pms/design-system";
import {
  Dialog,
  Button,
  Textarea,
  Combobox,
  ErrorMessage,
  useToasts,
  Avatar,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import { format, parseISO } from "date-fns";
import {
  FrappeError,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal Dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { submitApprovalSchema } from "./schema";
import type { SubmitApprovalProps, EmployeeRecord } from "./types";

const formatWeekLabel = (startDate: string, endDate: string) => {
  try {
    const start = format(parseISO(startDate), "MMM d");
    const end = format(parseISO(endDate), "MMM d");
    return `Week of ${start} - ${end}`;
  } catch {
    return `Week of ${startDate} - ${endDate}`;
  }
};

const SubmitApproval = ({
  open,
  onOpenChange,
  startDate,
  endDate,
  totalHours,
}: SubmitApprovalProps) => {
  const { reportsTo, employeeId } = useUser(({ state }) => ({
    reportsTo: state.reportsTo,
    employeeId: state.employeeId,
  }));
  const toast = useToasts();
  const [submitting, setSubmitting] = useState(false);
  const { call: submitForApproval } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.submit_for_approval",
  );

  const { data } = useFrappeGetCall(
    "next_pms.timesheet.api.employee.get_employee_list",
    {
      roles: ["Projects Manager", "Projects User"],
    },
  );

  const approvers = ((data?.message?.data ?? []) as EmployeeRecord[]).map(
    (emp) => ({
      label: emp.employee_name,
      value: emp.name,
      icon: <Avatar size="xs" image={emp.image} label={emp.employee_name} />,
    }),
  );

  const weekLabel = formatWeekLabel(startDate, endDate);
  const formattedHours = floatToTime(totalHours, 2);

  const form = useForm({
    defaultValues: {
      note: "",
      sendTo: reportsTo,
    },
    validators: {
      onSubmit: submitApprovalSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        await submitForApproval({
          employee: employeeId,
          start_date: startDate,
          end_date: endDate,
          approver: value.sendTo,
          notes: value.note,
        });
        toast.success("Timesheet submitted for approval successfully");
      } catch (err) {
        const error = parseFrappeErrorMsg(err as FrappeError);
        toast.error(error);
      } finally {
        setSubmitting(false);
        onOpenChange(false);
        form.reset();
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
          label="Submit"
          onClick={() => form.handleSubmit()}
          disabled={submitting}
          loading={submitting}
        />
      }
      options={{ title: "Submit for approval" }}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-surface-gray-1 rounded-lg px-4 py-2.5">
          <span className="text-sm text-ink-gray-8">{weekLabel}</span>
          <span className="text-sm text-ink-green-3 font-medium">
            {formattedHours}
          </span>
        </div>

        <form.Field
          name="note"
          children={(field) => (
            <div className="space-y-1.5">
              <label className="block text-xs text-ink-gray-5">Note</label>
              <Textarea
                value={field.state.value}
                placeholder="Comment"
                onChange={(e) => field.handleChange(e.target.value)}
                className="bg-white border-outline-gray-2"
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="sendTo"
          children={(field) => (
            <div className="space-y-1.5">
              <label className="block text-xs text-ink-gray-5">Send to</label>
              <Combobox
                value={field.state.value}
                placeholder="Select Approver"
                onChange={(val) => field.handleChange(val as string)}
                options={approvers}
                inputClassName="bg-white h-8 border-outline-gray-2"
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />
      </div>
    </Dialog>
  );
};

export default SubmitApproval;
