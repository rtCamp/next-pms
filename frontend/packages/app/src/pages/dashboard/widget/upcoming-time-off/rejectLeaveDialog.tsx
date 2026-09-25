/**
 * External dependencies.
 */
import {
  Avatar,
  Button,
  Dialog,
  ErrorMessage,
  FormLabel,
  Textarea,
} from "@rtcamp/frappe-ui-react";
import { AlertTriangle } from "@rtcamp/frappe-ui-react/icons";
import { useForm } from "@tanstack/react-form";

/**
 * Internal dependencies.
 */
import { useUpcomingTimeOff } from "./context";
import { rejectLeaveSchema, type RejectLeaveValues } from "./schema";
import {
  formatLeaveDateRange,
  formatLeaveDayType,
  formatLeaveDuration,
} from "./utils";
import type { EmployeeOnLeave } from "../../types";

interface RejectLeaveDialogProps {
  leave: EmployeeOnLeave | null;
  onClose: () => void;
}

const defaultValues: RejectLeaveValues = { reason: "" };

export function RejectLeaveDialog({ leave, onClose }: RejectLeaveDialogProps) {
  const rejectLeave = useUpcomingTimeOff((state) => state.rejectLeave);

  const form = useForm({
    defaultValues,
    validators: {
      onChange: rejectLeaveSchema,
      onSubmit: rejectLeaveSchema,
    },
    onSubmit: async ({ value }) => {
      if (!leave) return;
      const rejected = await rejectLeave(leave.name, value.reason.trim());
      if (rejected) handleClose();
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog
      open={leave !== null}
      onOpenChange={(open) => !open && handleClose()}
      options={{ title: "Reject leave request", size: "lg" }}
      actions={
        <form.Subscribe
          selector={(state) => ({
            isEmpty: state.values.reason.trim() === "",
            isSubmitting: state.isSubmitting,
          })}
          children={({ isEmpty, isSubmitting }) => (
            <div className="flex justify-end gap-2">
              <Button variant="subtle" size="md" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="solid"
                theme="red"
                size="md"
                disabled={isEmpty}
                loading={isSubmitting}
                onClick={() => form.handleSubmit()}
              >
                Reject leave
              </Button>
            </div>
          )}
        />
      }
    >
      {leave && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-outline-gray-1 bg-surface-gray-1 p-3">
            <Avatar
              size="lg"
              shape="circle"
              image={leave.user_image ?? undefined}
              label={leave.employee_name}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-base font-medium text-ink-gray-8">
                {leave.employee_name}
              </span>
              <span className="truncate text-sm text-ink-gray-6">
                {leave.leave_type} · {formatLeaveDayType(leave)}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
              <span className="text-base text-ink-gray-8">
                {formatLeaveDateRange(leave)}
              </span>
              <span className="text-sm text-ink-gray-6">
                {formatLeaveDuration(leave.total_leave_days)}
              </span>
            </div>
          </div>
          <form.Field
            name="reason"
            children={(field) => (
              <div className="flex flex-col gap-1.5">
                <FormLabel
                  label="Rejection reason"
                  required
                  size="md"
                  id="rejection-reason"
                />
                <Textarea
                  htmlId="rejection-reason"
                  variant="outline"
                  rows={4}
                  value={field.state.value}
                  placeholder="Explain why this leave request is being rejected..."
                  onChange={(event) => field.handleChange(event.target.value)}
                  className={
                    field.state.meta.isValid
                      ? undefined
                      : "border-outline-red-2 hover:border-outline-red-2"
                  }
                />
                {!field.state.meta.isValid && (
                  <div className="flex items-center gap-1 text-ink-red-4">
                    <AlertTriangle className="size-4 shrink-0" />
                    <ErrorMessage
                      message={field.state.meta.errors[0]?.message}
                    />
                  </div>
                )}
              </div>
            )}
          />
        </div>
      )}
    </Dialog>
  );
}
