/**
 * External dependencies.
 */
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Dialog } from "@rtcamp/frappe-ui-react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { useFrappeDeleteDoc } from "frappe-react-sdk";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RISK_DETAIL_PARAM } from "./constants";
import { useRisks } from "./context";

interface DeleteRiskDialogProps {
  riskName: string;
  onClose: () => void;
}

export function DeleteRiskDialog({ riskName, onClose }: DeleteRiskDialogProps) {
  const refreshRisks = useRisks((c) => c.actions.refreshRisks);
  const [, setSearchParams] = useSearchParams();
  const toast = useToasts();
  const { deleteDoc } = useFrappeDeleteDoc();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoc("Risk", riskName);
      setSearchParams((prev) => {
        prev.delete(RISK_DETAIL_PARAM);
        return prev;
      });
      refreshRisks();
      toast.success("Risk deleted");
      onClose();
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
      options={{ title: "Delete risk", size: "sm" }}
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
        Are you sure you want to delete this risk? This action cannot be undone.
      </p>
    </Dialog>
  );
}
