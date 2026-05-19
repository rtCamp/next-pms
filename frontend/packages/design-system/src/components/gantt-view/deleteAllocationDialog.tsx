import { Button, Dialog } from "@rtcamp/frappe-ui-react";

export interface DeleteAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  dateRange: string;
  hoursPerDay: string;
  totalHours: string;
  onConfirm: () => void;
}

export function DeleteAllocationDialog({
  open,
  onOpenChange,
  projectName,
  dateRange,
  hoursPerDay,
  totalHours,
  onConfirm,
}: DeleteAllocationDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      options={{ title: "Delete Allocation", size: "lg", position: "top" }}
      actions={
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            theme="gray"
            size="sm"
            label="Cancel"
            onClick={() => onOpenChange(false)}
          />
          <Button
            variant="solid"
            theme="red"
            size="sm"
            label="Delete"
            onClick={onConfirm}
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
    </Dialog>
  );
}
