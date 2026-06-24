/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Button, Dialog, Select } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { DeleteAllocationMode } from "./types";

const RECURRING_DELETE_OPTIONS: Array<{
  label: string;
  value: DeleteAllocationMode;
}> = [
  { label: "This allocation", value: "only_this" },
  {
    label: "This and future allocations",
    value: "this_and_future",
  },
  { label: "Whole series", value: "all_in_series" },
];

export interface DeleteAllocationDialogProps {
  onOpenChange: (open: boolean) => void;
  projectName: string;
  dateRange: string;
  hoursPerDay: string;
  totalHours: string;
  isRecurring?: boolean;
  onConfirm: (deleteMode: DeleteAllocationMode) => Promise<void>;
}

export function DeleteAllocationDialog({
  onOpenChange,
  projectName,
  dateRange,
  hoursPerDay,
  totalHours,
  isRecurring = false,
  onConfirm,
}: DeleteAllocationDialogProps) {
  const [deleteMode, setDeleteMode] =
    useState<DeleteAllocationMode>("only_this");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(deleteMode);
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteMode, onConfirm, isSubmitting]);

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (isSubmitting) {
          return;
        }

        onOpenChange(nextOpen);
      }}
      className="my-0"
      classNames={{
        header: "mb-5",
        content: "pt-5 pb-2",
        viewport: "justify-start pt-30",
        footer: "pb-6",
      }}
      options={{ title: "Delete Allocation", size: "lg", position: "top" }}
      actions={
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            theme="gray"
            size="sm"
            label="Cancel"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          />
          <Button
            variant="solid"
            theme="red"
            size="sm"
            label="Delete"
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={() => {
              void handleConfirm();
            }}
          />
        </div>
      }
    >
      <p className="text-sm text-ink-gray-7 leading-normal">
        Are you sure you want to delete{" "}
        <strong className="font-semibold text-ink-gray-8">
          {`"${projectName}" (${dateRange}, ${hoursPerDay}, ${totalHours})`}
        </strong>
        ? This cannot be undone.
      </p>

      {isRecurring ? (
        <div className="mt-4">
          <label className="mb-1.5 block text-sm text-ink-gray-6">
            Apply delete to
          </label>
          <Select
            value={deleteMode}
            onChange={(value) => setDeleteMode(value as DeleteAllocationMode)}
            variant="outline"
            className="h-8"
            disabled={isSubmitting}
            options={RECURRING_DELETE_OPTIONS}
          />
        </div>
      ) : null}
    </Dialog>
  );
}
