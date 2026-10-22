/**
 * External dependencies.
 */
import { useState } from "react";
import { DeleteActionDialog } from "@next-pms/design-system/components";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { FrappeError, useFrappeDeleteDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { FileAttachment } from "../types";
import { FileCard } from "./fileCard";

interface AttachmentListProps {
  attachments: FileAttachment[];
  canRemove: boolean;
  onRemoved: () => void;
}

export function AttachmentList({
  attachments,
  canRemove,
  onRemoved,
}: AttachmentListProps) {
  const [fileToRemove, setFileToRemove] = useState<FileAttachment | null>(null);
  const { deleteDoc } = useFrappeDeleteDoc();
  const toast = useToasts();

  const removeFile = async (file: FileAttachment) => {
    try {
      await deleteDoc("File", file.name);
      toast.success("Attachment removed");
      onRemoved();
    } catch (err) {
      toast.error(parseFrappeErrorMsg(err as FrappeError));
      throw err;
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {attachments.map((file) => (
          <FileCard
            key={file.name}
            file={file}
            onRemove={canRemove ? () => setFileToRemove(file) : undefined}
          />
        ))}
      </div>
      {fileToRemove && (
        <DeleteActionDialog
          title="Remove attachment"
          description={`Are you sure you want to remove "${fileToRemove.file_name}"? This action cannot be undone.`}
          confirmLabel="Remove"
          onClose={() => setFileToRemove(null)}
          onConfirm={() => removeFile(fileToRemove)}
        />
      )}
    </>
  );
}
