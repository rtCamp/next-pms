/**
 * External dependencies.
 */
import { useState } from "react";
import { Button, Dialog, useToasts } from "@rtcamp/frappe-ui-react";
import { useFrappeUpdateDoc } from "frappe-react-sdk";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { EnrichedRiskUpdateEntry, RiskDetail } from "../types";

interface DeleteUpdateEntryDialogProps {
  entry: EnrichedRiskUpdateEntry;
  risk: RiskDetail;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteUpdateEntryDialog({
  entry,
  risk,
  onClose,
  onSuccess,
}: DeleteUpdateEntryDialogProps) {
  const toast = useToasts();
  const { updateDoc } = useFrappeUpdateDoc();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const remainingEntries = (risk.risk_update_log ?? [])
        .filter((e) => e.name !== entry.name)
        .map((e) => ({
          name: e.name,
          status: e.status,
          risk_level: e.risk_level,
          note: e.note,
          updated_at: e.updated_at,
        }));

      await updateDoc("Risk", risk.name, {
        modified: risk.modified,
        risk_update_log: remainingEntries,
      });

      onSuccess();
      onClose();
      toast.success("Update deleted");
    } catch (err) {
      toast.error(parseFrappeErrorMsg(err as FrappeError));
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      options={{ title: "Delete update", size: "sm" }}
      actions={
        <div className="flex gap-2 w-full">
          <Button
            className="flex-1 h-7"
            variant="outline"
            label="Cancel"
            onClick={onClose}
            disabled={deleting}
          />
          <Button
            className="flex-1 h-7"
            variant="solid"
            label="Delete"
            onClick={() => void handleDelete()}
            disabled={deleting}
            loading={deleting}
          />
        </div>
      }
    >
      <p className="text-base text-ink-gray-7">
        Are you sure you want to delete this update? This action cannot be
        undone.
      </p>
    </Dialog>
  );
}
