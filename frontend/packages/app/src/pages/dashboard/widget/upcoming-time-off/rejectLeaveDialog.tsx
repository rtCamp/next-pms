/**
 * External dependencies.
 */
import {
  Button,
  Dialog,
  ErrorMessage,
  FormLabel,
  Textarea,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";

/**
 * Internal dependencies.
 */
import { useUpcomingTimeOff } from "./context";
import { LeaveSummaryCard } from "./leaveSummaryCard";
import { rejectLeaveSchema, type RejectLeaveValues } from "./schema";
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
          <LeaveSummaryCard leave={leave} />
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
                />
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />
        </div>
      )}
    </Dialog>
  );
}
